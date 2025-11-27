'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import {
  Save,
  User,
  Bell,
  Shield,
  Camera,
  RefreshCcw,
  HelpCircle,
  Trash2,
  Loader2,
  Crown,
  X,
  Mail,
} from 'lucide-react';
import OTPForm from '@/components/auth/OTPForm';
import settingsService, {
  UpdateNotificationsDto,
  UpdateProfileDto,
  UserSettings,
  ManagedUser,
} from '@/services/settings.service';
import { useAuth } from '@/stores/AuthContext';
import { UserRole, getRoleLabel } from '@/constants/userRole';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserSettings | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateProfileDto>({
    fullName: '',
    phone: '',
    address: '',
  });
  const [notificationForm, setNotificationForm] = useState<UpdateNotificationsDto>({
    notifyEmail: true,
    notifyBudget: true,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin, user: currentUser } = useAuth();
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userAction, setUserAction] = useState<{ userId: string; type: 'role' | 'delete' } | null>(
    null
  );
  const roleOptions = [
    { value: UserRole.SUPER_ADMIN, label: 'Quản trị viên' },
    { value: UserRole.VIEWER, label: 'Người xem' },
  ];
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getProfile();
      const data = response.data;
      setProfile(data);
      setProfileForm({
        fullName: data.fullName || '',
        phone: data.phone || '',
        address: data.address || '',
      });
      setNotificationForm({
        notifyEmail: data.notifyEmail,
        notifyBudget: data.notifyBudget,
      });
    } catch (error: any) {
        showToast({
          type: 'error',
          title: 'Không thể tải cài đặt',
          description: error.message,
        });
    } finally {
      setIsLoading(false);
    }
  };

    fetchProfile();
  }, [showToast]);

  const loadUsers = useCallback(
    async (showNotification = false) => {
      if (!isAdmin) {
        return;
      }
      try {
        setUsersLoading(true);
        const response = await settingsService.getUsers();
        setManagedUsers(response.data || []);
        if (showNotification) {
          showToast({
            type: 'success',
            title: 'Đã cập nhật danh sách thành viên',
          });
        }
      } catch (error: any) {
        showToast({
          type: 'error',
          title: 'Không thể tải danh sách người dùng',
          description: error.message,
        });
      } finally {
        setUsersLoading(false);
      }
    },
    [isAdmin, showToast]
  );

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setManagedUsers([]);
    }
  }, [isAdmin, loadUsers]);

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      const response = await settingsService.updateProfile(profileForm);
      setProfile(response.data);
      showToast({
        type: 'success',
        title: 'Đã lưu thông tin cá nhân',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật thông tin',
        description: error.message,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotificationSave = async () => {
    try {
      setSavingNotifications(true);
      const response = await settingsService.updateNotifications(notificationForm);
      setProfile(response.data);
      showToast({
        type: 'success',
        title: 'Đã cập nhật cài đặt thông báo',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật thông báo',
        description: error.message,
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSendOTP = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ thông tin mật khẩu',
      });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({
        type: 'warning',
        title: 'Mật khẩu xác nhận không khớp',
      });
      return;
    }
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(passwordForm.newPassword) || passwordForm.newPassword.length < 8) {
      showToast({
        type: 'warning',
        title: 'Mật khẩu không đủ mạnh',
        description: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số',
      });
      return;
    }
    try {
      setSendingOtp(true);
      await settingsService.sendChangePasswordOTP();
      setShowOtpForm(true);
      showToast({
        type: 'success',
        title: 'Đã gửi mã OTP',
        description: 'Vui lòng kiểm tra email và nhập mã OTP để hoàn tất đổi mật khẩu',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể gửi mã OTP',
        description: error.message,
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setOtpLoading(true);
      await settingsService.sendChangePasswordOTP();
      showToast({
        type: 'success',
        title: 'Đã gửi lại mã OTP',
        description: 'Vui lòng kiểm tra email',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể gửi lại mã OTP',
        description: error.message,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!otpCode || otpCode.length !== 6) {
      showToast({
        type: 'warning',
        title: 'Mã OTP không hợp lệ',
        description: 'Vui lòng nhập đúng 6 chữ số',
      });
      return;
    }
    try {
      setChangingPassword(true);
      await settingsService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        otpCode,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOtpCode('');
      setShowOtpForm(false);
      showToast({
        type: 'success',
        title: 'Đổi mật khẩu thành công',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể đổi mật khẩu',
        description: error.message,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelChangePassword = () => {
    setShowOtpForm(false);
    setOtpCode('');
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'warning',
        title: 'Tệp không hợp lệ',
        description: 'Vui lòng chọn ảnh định dạng JPEG, PNG hoặc WEBP',
      });
      event.target.value = '';
      return;
    }
    try {
      setAvatarUploading(true);
      const response = await settingsService.updateAvatar(file);
      setProfile(response.data);
      showToast({
        type: 'success',
        title: 'Ảnh đại diện đã được cập nhật',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật ảnh đại diện',
        description: error.message,
      });
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handleUserRoleChange = async (userId: string, nextRole: UserRole) => {
    if (userId === currentUser?.id) {
      showToast({
        type: 'warning',
        title: 'Không thể thay đổi vai trò của chính bạn',
      });
      return;
    }
    try {
      setUserAction({ userId, type: 'role' });
      const response = await settingsService.updateUserRole(userId, nextRole);
      const updatedUser = response.data;
      setManagedUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...(updatedUser || { role: nextRole }) } : user
        )
      );
      showToast({
        type: 'success',
        title: 'Cập nhật vai trò thành công',
        description: updatedUser?.fullName || updatedUser?.email,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể cập nhật vai trò',
        description: error.message,
      });
    } finally {
      setUserAction(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUser?.id) {
      showToast({
        type: 'warning',
        title: 'Không thể tự xóa tài khoản',
      });
      return;
    }
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${email}?`);
    if (!confirmed) return;

    try {
      setUserAction({ userId, type: 'delete' });
      await settingsService.deleteUser(userId);
      setManagedUsers((prev) => prev.filter((user) => user.id !== userId));
      showToast({
        type: 'success',
        title: 'Đã xóa người dùng',
        description: email,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Không thể xóa người dùng',
        description: error.message,
      });
    } finally {
      setUserAction(null);
    }
  };

  if (isLoading || !profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-gray-500">Đang tải cài đặt...</div>
        </div>
      </DashboardLayout>
    );
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || process.env.NEXT_PUBLIC_API_URL || '';
  const avatarSrc = profile.avatarUrl
    ? profile.avatarUrl.startsWith('http')
      ? profile.avatarUrl
      : `${apiBase}${profile.avatarUrl}`
    : null;
  const joinedAt = new Date(profile.createdAt);
  const notificationSummary = (() => {
    if (notificationForm.notifyEmail && notificationForm.notifyBudget) {
      return 'Nhận tất cả thông báo';
    }
    if (notificationForm.notifyEmail) {
      return 'Chỉ qua email';
    }
    if (notificationForm.notifyBudget) {
      return 'Chỉ cảnh báo ngân sách';
    }
    return 'Đang tắt thông báo';
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-sm text-white">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cài đặt</h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Quản lý cài đặt tài khoản và hệ thống
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Vai trò:{' '}
              <span className="font-semibold capitalize">
                {profile.role?.replace('_', ' ')}
              </span>
              {' • Tham gia từ '}
              <Tooltip content={joinedAt.toLocaleString('vi-VN')}>
                <span className="cursor-help">{joinedAt.toLocaleDateString('vi-VN')}</span>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-5 py-4 flex flex-col gap-2 min-h-[120px]">
            <p className="text-xs uppercase tracking-wide text-gray-500">Email đăng nhập</p>
            <p className="text-base font-semibold text-gray-900 wrap-break-word">{profile.email}</p>
            <span className="text-xs text-gray-500">Dùng để đăng nhập và nhận thông báo</span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-5 py-4 flex flex-col gap-2 min-h-[120px]">
            <p className="text-xs uppercase tracking-wide text-gray-500">Vai trò</p>
            <p className="text-base font-semibold text-gray-900 capitalize">{profile.role?.replace('_', ' ')}</p>
            <span className="text-xs text-gray-500">Quyền hạn hiển thị ở toàn hệ thống</span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-5 py-4 flex flex-col gap-2 min-h-[120px]">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tham gia từ</p>
            <p className="text-base font-semibold text-gray-900">{joinedAt.toLocaleDateString('vi-VN')}</p>
            <span className="text-xs text-gray-500">Lần đầu tiên tạo tài khoản</span>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-5 py-4 flex flex-col gap-2 min-h-[120px]">
            <p className="text-xs uppercase tracking-wide text-gray-500">Cài đặt thông báo</p>
            <p className="text-sm font-semibold text-gray-900 leading-relaxed">{notificationSummary}</p>
            <span className="text-xs text-gray-500">Có thể thay đổi ở khu vực bên phải</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2" title="Thông tin cá nhân">
            <p className="text-sm text-gray-500 mb-6">
              Cập nhật thông tin sẽ giúp các thông báo và báo cáo chính xác hơn. Bạn có thể thay đổi ảnh đại
              diện và thông tin liên hệ bất kỳ lúc nào.
            </p>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border border-blue-200 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-sm">
                    {profile.fullName?.[0]?.toUpperCase() || profile.email[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Ảnh đại diện</p>
                    <p className="text-sm text-gray-700">
                      Định dạng hỗ trợ: PNG, JPG, WEBP (tối đa 5MB). Ảnh rõ ràng giúp dễ nhận diện hơn.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarButtonClick}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? 'Đang tải...' : 'Thay đổi ảnh'}
                    </Button>
                    <span className="text-xs text-gray-500">Kích thước khuyên dùng 400x400px</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên"
                  value={profileForm.fullName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  placeholder="Nhập họ tên"
                />
                <Input label="Email" type="email" value={profile.email} disabled />
                <Input
                  label="Số điện thoại"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Ví dụ: 0901..."
                />
                <Input
                  label="Địa chỉ"
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Nhập địa chỉ"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <p className="text-sm text-gray-500">
                  Thông tin được đồng bộ ngay sau khi lưu. Hãy kiểm tra lại trước khi xác nhận.
                </p>
                <Button onClick={handleProfileSave} disabled={savingProfile} className="min-w-[160px]">
                  {savingProfile ? (
                    'Đang lưu...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2 inline" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="xl:col-span-1 h-full" title="Thông báo">
            <p className="text-sm text-gray-500 mb-4">
              Tùy chỉnh kênh nhận thông báo để không bỏ lỡ cập nhật quan trọng về tiến độ và ngân sách.
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Thông báo qua email</p>
                      <p className="text-sm text-gray-600">
                        Nhận thông báo về các khoản chi phí và cập nhật quan trọng
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationForm.notifyEmail}
                      onChange={(e) =>
                        setNotificationForm({ ...notificationForm, notifyEmail: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Thông báo vượt ngân sách</p>
                      <p className="text-sm text-gray-600">
                        Cảnh báo ngay khi chi phí vượt giới hạn đã đặt ra
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationForm.notifyBudget}
                      onChange={(e) =>
                        setNotificationForm({ ...notificationForm, notifyBudget: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900">Tóm tắt</p>
                <p className="mt-1">{notificationSummary}</p>
              </div>
              <Button
                onClick={handleNotificationSave}
                disabled={savingNotifications}
                className="w-full"
              >
                {savingNotifications ? 'Đang lưu...' : 'Lưu cài đặt thông báo'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Security Settings */}
        <Card title="Bảo mật">
          <p className="text-sm text-gray-500 mb-4">
            Đảm bảo mật khẩu đủ mạnh và được cập nhật định kỳ để bảo vệ dữ liệu dự án của bạn.
          </p>
          <div className="space-y-4">
            {!showOtpForm ? (
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Đổi mật khẩu</h4>
                    <p className="text-sm text-gray-600">Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Mật khẩu hiện tại"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    disabled={sendingOtp}
                  />
                  <Input
                    label="Mật khẩu mới"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    disabled={sendingOtp}
                  />
                  <Input
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    disabled={sendingOtp}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
                  <p className="text-sm text-gray-500">
                    Sau khi nhập mật khẩu, bạn sẽ nhận mã OTP qua email để xác thực.
                  </p>
                  <Button onClick={handleSendOTP} disabled={sendingOtp}>
                    {sendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                        Đang gửi OTP...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2 inline" />
                        Gửi mã OTP
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Xác thực đổi mật khẩu</h4>
                      <p className="text-sm text-gray-600">Nhập mã OTP đã gửi đến email của bạn</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelChangePassword}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Hủy"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <OTPForm
                  email={profile.email}
                  onVerify={async (code: string) => {
                    setOtpCode(code);
                    await handleChangePassword();
                  }}
                  onResend={handleResendOTP}
                  isLoading={changingPassword || otpLoading}
                />
              </div>
            )}
            {!showOtpForm && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">💡 Gợi ý bảo mật</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Đổi mật khẩu định kỳ mỗi 60 ngày để tăng bảo mật</li>
                  <li>Không sử dụng mật khẩu đã dùng trước đó</li>
                  <li>Kích hoạt xác thực hai lớp (sắp ra mắt) để tăng bảo mật tài khoản</li>
                </ul>
              </div>
            )}
          </div>
        </Card>

        {isAdmin && (
          <Card title="Quản lý thành viên">
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white text-blue-600 border border-blue-100">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Quản trị viên có thể mời thêm thành viên, phân quyền hoặc thu hồi truy cập.
                    </p>
                    <p className="text-xs text-gray-600">
                      Lưu ý: Luôn đảm bảo hệ thống có ít nhất một quản trị viên hoạt động.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{managedUsers.length}</span> thành viên đang hoạt động
                  {managedUsers.some((user) => user.role === UserRole.SUPER_ADMIN) && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                      Có quản trị viên
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 hidden sm:block">
                    Nhấn tải lại để đồng bộ dữ liệu mới nhất
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUsers(true)}
                    disabled={usersLoading}
                    className="inline-flex items-center gap-2"
                  >
                    {usersLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="w-4 h-4" />
                        Tải lại
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải danh sách người dùng...
                </div>
              ) : managedUsers.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Hiện chưa có thành viên nào khác trong hệ thống.
                </div>
              ) : (
                <div className="space-y-3">
                  {managedUsers.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    const isUpdating = userAction?.userId === user.id && userAction?.type === 'role';
                    const isDeleting = userAction?.userId === user.id && userAction?.type === 'delete';
                    const userAvatar = user.avatarUrl
                      ? user.avatarUrl.startsWith('http')
                        ? user.avatarUrl
                        : `${apiBase}${
                            user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`
                          }`
                      : null;

                    const roleColor =
                      user.role === UserRole.SUPER_ADMIN
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-slate-50 text-slate-600 border border-slate-100';

                    return (
                      <div
                        key={user.id}
                        className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-4 sm:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:border-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={user.email}
                              className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold shadow-sm">
                              {(user.fullName || user.email)[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {user.fullName || 'Chưa có tên'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                          <div className="flex flex-col gap-2 sm:w-48">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleUserRoleChange(user.id, e.target.value as UserRole)
                              }
                              disabled={isSelf || isUpdating || isDeleting}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            >
                              {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <span className={`inline-flex items-center justify-start px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                              {getRoleLabel(user.role)}
                              {isSelf && ' • Bạn'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={isSelf || isDeleting || isUpdating}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xóa
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Help Section */}
        <Card title="Hỗ trợ & hướng dẫn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">Các bước gợi ý</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc list-inside">
                <li>Cập nhật hồ sơ cá nhân trước khi chia sẻ quyền truy cập</li>
                <li>Kích hoạt thông báo ngân sách để tránh vượt chi</li>
                <li>Đổi mật khẩu định kỳ mỗi 60 ngày để tăng bảo mật</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Thông tin liên hệ</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  Email hỗ trợ:{' '}
                  <span className="font-medium text-gray-900">namng.work@gmail.com</span>
                </p>
                <p>
                  Hotline: <span className="font-medium text-gray-900">1900 636 868</span>
                </p>
                <p>Giờ làm việc: 8h00 - 18h00 (T2 - T7)</p>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Đội ngũ hỗ trợ sẽ phản hồi trong vòng tối đa 24h kể từ khi nhận được yêu cầu.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4 bg-linear-to-br from-blue-50 via-white to-blue-50">
              <p className="text-sm font-semibold text-gray-900">Tình trạng tài khoản</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">ID:</span> {profile.id}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Trạng thái:</span>{' '}
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Đang hoạt động
                  </span>
                </p>
                <p>
                  <span className="font-medium text-gray-900">Lần cập nhật cuối:</span>{' '}
                  {joinedAt.toLocaleDateString('vi-VN')}
                </p>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Nếu bạn cần nâng cấp vai trò hoặc thêm thành viên mới, vui lòng liên hệ quản trị viên hệ thống.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

