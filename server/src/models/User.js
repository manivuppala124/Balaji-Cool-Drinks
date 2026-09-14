import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    area: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    pincode: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[6-9]\d{9}$/,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    password: { type: String, required: true, select: false, minlength: 6 },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    customerType: {
      type: String,
      enum: ['RETAIL', 'WHOLESALE'],
      default: 'RETAIL',
    },
    wholesaleCustomer: { type: Boolean, default: false },
    wholesaleApproved: { type: Boolean, default: false },
    addresses: [addressSchema],
    isBlocked: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ mobile: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1, customerType: 1 });
userSchema.index({ fullName: 'text', mobile: 'text', email: 'text' });

userSchema.pre('save', function setWholesaleFlags(next) {
  if (this.customerType === 'WHOLESALE') {
    this.wholesaleCustomer = true;
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
