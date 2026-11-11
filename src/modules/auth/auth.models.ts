import mongoose, { Schema } from 'mongoose';

export const roles = [
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'ORGANIZATION_ADMIN',
  'ORGANIZATION_MEMBER',
  'FLORIST',
  'GROWER',
  'USER',
] as const;
export type Role = (typeof roles)[number];
export const organizationTypes = [
  'GOVERNMENT_BOTANICAL_INSTITUTION',
  'HORTICULTURAL_SOCIETY',
  'FLORICULTURE_ASSOCIATION',
  'PLANT_CONSERVATION_ORGANIZATION',
  'COMMUNITY_GARDENING_SOCIETY',
  'RESEARCH_EDUCATIONAL_INSTITUTION',
] as const;
export const positions = [
  'PRESIDENT',
  'SECRETARY',
  'TREASURER',
  'BOTANICAL_OFFICER',
  'RESEARCH_OFFICER',
  'COORDINATOR',
  'GENERAL_MEMBER',
] as const;
export const accountTypes = [
  'USER',
  'FLORIST',
  'GROWER',
  'ORGANIZATION_REPRESENTATIVE',
] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: roles, default: 'USER', required: true },
    status: {
      type: String,
      enum: ['PENDING_EMAIL_VERIFICATION', 'ACTIVE', 'SUSPENDED'],
      default: 'PENDING_EMAIL_VERIFICATION',
    },
    emailVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String, select: false },
    verificationExpiresAt: { type: Date, select: false },
    phone: { type: String, maxlength: 30, default: '' },
    address: { type: String, maxlength: 300, default: '' },
    mustChangePassword: { type: Boolean, default: false },
    accountType: { type: String, enum: accountTypes, default: 'USER' },
  },
  { timestamps: true, strict: 'throw' },
);

const applicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: accountTypes.filter((t) => t !== 'USER'),
      required: true,
    },
    name: { type: String, required: true, maxlength: 150 },
    contact: { type: String, required: true, maxlength: 200 },
    location: { type: String, required: true, maxlength: 200 },
    organizationType: { type: String, enum: organizationTypes },
    position: { type: String, enum: positions },
    evidenceUrl: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    decisionReason: { type: String, maxlength: 1000 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true },
);

const organizationSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: organizationTypes, required: true },
    contact: String,
    location: String,
    status: { type: String, default: 'APPROVED' },
    applicationId: {
      type: Schema.Types.ObjectId,
      unique: true,
      required: true,
    },
  },
  { timestamps: true },
);
const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true },
    role: {
      type: String,
      enum: ['ORGANIZATION_ADMIN', 'ORGANIZATION_MEMBER'],
      required: true,
    },
    position: { type: String, enum: positions },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REMOVED'],
      default: 'PENDING',
    },
  },
  { timestamps: true },
);
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
const businessSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, unique: true },
    type: { type: String, enum: ['FLORIST', 'GROWER'], required: true },
    name: String,
    contact: String,
    location: String,
    status: { type: String, default: 'APPROVED' },
  },
  { timestamps: true },
);
const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    csrfToken: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);
const auditSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true },
);
const throttleSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, expires: 0 },
});

export const User = mongoose.model('User', userSchema);
export const Application = mongoose.model('Application', applicationSchema);
export const Organization = mongoose.model('Organization', organizationSchema);
export const Membership = mongoose.model('Membership', membershipSchema);
export const Business = mongoose.model('BusinessProfile', businessSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const AuditLog = mongoose.model('AuditLog', auditSchema);
export const AuthThrottle = mongoose.model('AuthThrottle', throttleSchema);
