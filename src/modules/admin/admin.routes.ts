import { Router } from 'express';
import mongoose from 'mongoose';
import {
  Application,
  AuditLog,
  Business,
  Membership,
  Organization,
  User,
} from '../auth/auth.models.js';
import {
  HttpError,
  publicUser,
  requireRoles,
  requireTrustedOrigin,
  requireUser,
  text,
} from '../auth/auth.security.js';

export const adminRouter = Router();
adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
adminRouter.use(
  requireTrustedOrigin,
  requireUser,
  requireRoles('SUPER_ADMIN', 'PLATFORM_ADMIN'),
);
adminRouter.get('/overview', async (_req, res) => {
  const [users, organizations, businesses, pending, audit] = await Promise.all([
    User.countDocuments(),
    Organization.countDocuments({ status: 'APPROVED' }),
    Business.countDocuments({ status: 'APPROVED' }),
    Application.countDocuments({ status: 'PENDING' }),
    res.locals.user.role === 'SUPER_ADMIN'
      ? AuditLog.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .select('action details createdAt')
          .lean()
      : Promise.resolve([]),
  ]);
  res.json({
    counts: { users, organizations, businesses, pending },
    audit: res.locals.user.role === 'SUPER_ADMIN' ? audit : [],
  });
});
adminRouter.get('/applications', async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const applications = await Application.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * 20)
    .limit(20)
    .populate('userId', 'name email emailVerified status')
    .lean();
  res.json({ applications, total: await Application.countDocuments(), page });
});
adminRouter.post('/applications/:id/review', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw new HttpError(400, 'Invalid application.');
  if (!['APPROVED', 'REJECTED'].includes(req.body.decision))
    throw new HttpError(400, 'Choose approve or reject.');
  const reason = text(req.body.reason, 'review reason', 1000);
  await mongoose.connection.transaction(async (session) => {
    const application = await Application.findOne({
      _id: req.params.id,
      status: 'PENDING',
    }).session(session);
    if (!application)
      throw new HttpError(
        409,
        'This application has already been reviewed or does not exist.',
      );
    const user = await User.findById(application.userId).session(session);
    if (!user || user.role !== 'USER')
      throw new HttpError(
        409,
        'The applicant account is not eligible for this review.',
      );
    if (req.body.decision === 'APPROVED') {
      if (!user.emailVerified || user.status !== 'ACTIVE')
        throw new HttpError(
          409,
          'The applicant must verify their email before approval.',
        );
      if (application.type === 'ORGANIZATION_REPRESENTATIVE') {
        if (!application.organizationType || !application.position)
          throw new HttpError(
            409,
            'Organization category and position are required.',
          );
        const [organization] = await Organization.create(
          [
            {
              applicationId: application._id,
              name: application.name,
              type: application.organizationType,
              contact: application.contact,
              location: application.location,
            },
          ],
          { session },
        );
        await Membership.create(
          [
            {
              userId: user._id,
              organizationId: organization._id,
              role: 'ORGANIZATION_ADMIN',
              position: application.position,
              status: 'ACTIVE',
            },
          ],
          { session },
        );
        user.role = 'ORGANIZATION_ADMIN';
      } else {
        await Business.create(
          [
            {
              ownerId: user._id,
              type: application.type,
              name: application.name,
              contact: application.contact,
              location: application.location,
            },
          ],
          { session },
        );
        user.role = application.type === 'GROWER' ? 'GROWER' : 'FLORIST';
      }
      await user.save({ session });
    }
    application.status = req.body.decision;
    application.decisionReason = reason;
    application.reviewedBy = res.locals.user._id;
    application.reviewedAt = new Date();
    await application.save({ session });
    await AuditLog.create(
      [
        {
          actorId: res.locals.user._id,
          action: `APPLICATION_${req.body.decision}`,
          targetId: application._id,
          details: reason,
        },
      ],
      { session },
    );
  });
  res.json({ message: 'Application review saved.' });
});
adminRouter.get('/users', requireRoles('SUPER_ADMIN'), async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number(req.query.page) || 1));
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * 20)
    .limit(20);
  res.json({
    users: users.map(publicUser),
    total: await User.countDocuments(),
    page,
  });
});
// Staff assignment is intentionally separate from public registration/business verification.
adminRouter.post(
  '/users/:id/platform-admin',
  requireRoles('SUPER_ADMIN'),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      throw new HttpError(400, 'Invalid user.');
    if (typeof req.body.enabled !== 'boolean')
      throw new HttpError(400, 'Provide a staff assignment decision.');
    const reason = text(req.body.reason, 'assignment reason', 1000);
    await mongoose.connection.transaction(async (session) => {
      const user = await User.findById(req.params.id).session(session);
      if (
        !user ||
        !user.emailVerified ||
        user.status !== 'ACTIVE' ||
        !['USER', 'PLATFORM_ADMIN'].includes(user.role)
      )
        throw new HttpError(
          409,
          'Only active, verified standard users or Platform Admins are eligible.',
        );
      if (
        await Application.exists({
          userId: user._id,
          status: 'PENDING',
        }).session(session)
      )
        throw new HttpError(409, 'Resolve the pending application first.');
      user.role = req.body.enabled ? 'PLATFORM_ADMIN' : 'USER';
      await user.save({ session });
      await SessionRevoke(user._id, session);
      await AuditLog.create(
        [
          {
            actorId: res.locals.user._id,
            action: 'PLATFORM_ADMIN_ASSIGNMENT',
            targetId: user._id,
            details: reason,
          },
        ],
        { session },
      );
    });
    res.json({
      message: 'Staff assignment updated; existing sessions revoked.',
    });
  },
);
import { Session } from '../auth/auth.models.js';
async function SessionRevoke(
  userId: mongoose.Types.ObjectId,
  session: mongoose.ClientSession,
) {
  await Session.deleteMany({ userId }, { session });
}

adminRouter.post(
  '/users/:id/status',
  requireRoles('SUPER_ADMIN'),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id))
      throw new HttpError(400, 'Invalid user.');
    if (!['ACTIVE', 'SUSPENDED'].includes(req.body.status))
      throw new HttpError(400, 'Choose an account status.');
    const reason = text(req.body.reason, 'status change reason', 1000);
    await mongoose.connection.transaction(async (session) => {
      const user = await User.findById(req.params.id).session(session);
      if (
        !user ||
        user.role === 'SUPER_ADMIN' ||
        String(user._id) === String(res.locals.user._id)
      )
        throw new HttpError(
          409,
          'Super Admin accounts must be managed through controlled administration.',
        );
      if (req.body.status === 'ACTIVE' && !user.emailVerified)
        throw new HttpError(
          409,
          'Email verification is required before activation.',
        );
      user.status = req.body.status;
      await user.save({ session });
      await SessionRevoke(user._id, session);
      await AuditLog.create(
        [
          {
            actorId: res.locals.user._id,
            action: 'ACCOUNT_STATUS_CHANGED',
            targetId: user._id,
            details: `${req.body.status}: ${reason}`,
          },
        ],
        { session },
      );
    });
    res.json({ message: 'Account status updated; existing sessions revoked.' });
  },
);
