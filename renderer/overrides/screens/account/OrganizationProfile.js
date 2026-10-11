/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/account/OrganizationProfile.js
 *
 * The organisation account page, laid out like the individual Profile
 * override (@desktop/ProfileKit): a banner with the logo, name, verification
 * status, national ID and manager, a profile-completion ring; then a tab list
 * beside one focused panel — organisation, manager & representative, contact
 * & address, documents, authorised users, security, settings. The side
 * column shows the verification / edit-request status and what is missing.
 * Fields are read-only until «درخواست ویرایش», as on the phone.
 *
 * Same data flow as the mobile file: the same profile / update / password
 * requests, the same edit-request switching between the saved data and the
 * pending request. Documents and authorised users call the same
 * @services/OrganizationAccountApi functions as the mobile sections
 * (components/account/OrganizationAccountSections), drawn with desktop
 * controls. Desktop fix: on the web a new logo is appended to the FormData as
 * a real File (the mobile `{ uri, name, type }` object only works natively).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import DatePickerModal from '@components/DatePickerModal';
import { formatDateTime, showAlert, showToastOrAlert } from '@helpers/Common';

import useLogout from '@hooks/useLogout';
import { imageUri, uri } from '@services/URL';
import { useSelector } from 'react-redux';
import { clearAccountProfileCache } from '@services/receipt/receiptProfile';
import { RESOURCE_STATE, useRemoteResource } from '@components/account/AccountUI';
import {
  VERIFICATION_STATUS,
  addAuthorizedUser,
  deleteDocument,
  listAuthorizedUsers,
  listDocuments,
  removeAuthorizedUser,
  resolveVerificationStatus,
  uploadDocument,
} from '@services/OrganizationAccountApi';
import { isNotImplemented } from '@services/AccountSecurityApi';

import { DButton, EmptyState, IconButton, Pill, Skeleton, Spinner, formatNumber, useDir } from '@desktop/ui';
import { Field, FieldGrid, SelectField, TextField } from '@desktop/FormKit';
import {
  ChecklistCard,
  DangerZone,
  LinkRows,
  PanelGroup,
  PanelNote,
  ProfileBanner,
  ProfileLayout,
  ProfileNav,
  ProfilePanel,
  SaveBar,
  SideCard,
  SignOutButton,
  StrengthMeter,
  ThemeSwitch,
  useAccountRows,
} from '@desktop/ProfileKit';
import { motion, palette, radii, surface, tone } from '@desktop/desktopTheme';

const failMessage = (t, result) =>
  isNotImplemented(result)
    ? t('This feature will be available soon.')
    : result?.message || t('The operation failed. Please try again.');

// همان برچسب‌های VerificationStatusCard موبایل، با رنگ‌های Pill دسکتاپ
const STATUS_VIEW = {
  [VERIFICATION_STATUS.PENDING]: { label: 'Under review by the admin panel', kind: 'warning', icon: 'hourglass-outline' },
  [VERIFICATION_STATUS.APPROVED]: { label: 'Approved', kind: 'success', icon: 'checkmark-circle' },
  [VERIFICATION_STATUS.SUSPENDED]: { label: 'Suspended', kind: 'danger', icon: 'pause-circle' },
  [VERIFICATION_STATUS.DELETED]: { label: 'Deleted', kind: 'neutral', icon: 'trash' },
  [VERIFICATION_STATUS.REJECTED]: { label: 'Rejected', kind: 'danger', icon: 'close-circle' },
};

const IR_MOBILE = /^09\d{9}$/;
const toLatinDigits = (text) => String(text || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

const COPY = {
  fa: {
    kicker: 'حساب سازمانی لوپ', org: 'سازمان / شرکت', nationalId: 'شناسه ملی',
    completion: 'تکمیل پروفایل', complete: 'پروفایل سازمان کامل است', left: (n) => `${formatNumber(n, 'fa')} مورد باقی مانده`,
    todo: 'برای تکمیل پروفایل', todoDone: 'اطلاعات اصلی سازمان ثبت شده است. رسیدها و قراردادها با همین اطلاعات صادر می‌شوند.',
    items: { logo: 'لوگوی سازمان', email: 'ایمیل سازمان', phone: 'تلفن ثابت', region: 'منطقه', address: 'آدرس سازمان', postal: 'کد پستی', birth: 'تاریخ تولد مدیر' },
    tabs: {
      org: ['اطلاعات سازمان', 'نام، شناسه‌ها و سوابق'],
      manager: ['مدیر و نماینده', 'مدیرعامل و نماینده‌ی او'],
      contact: ['تماس و آدرس', 'ایمیل، تلفن و نشانی'],
      documents: ['مدارک سازمان', 'آگهی تأسیس و تغییرات'],
      users: ['کاربران مجاز', 'افرادی که از طرف سازمان اقدام می‌کنند'],
      security: ['امنیت و رمز عبور', 'رمز عبور و تأیید دومرحله‌ای'],
      settings: ['تنظیمات حساب', 'ظاهر، نسخه، حذف حساب'],
    },
    status: 'وضعیت حساب', editStatus: 'درخواست ویرایش',
    readonlyNote: 'اطلاعات سازمان فقط با «درخواست ویرایش» تغییر می‌کند و پس از بررسی پنل مدیریت اعمال می‌شود.',
    editingNote: 'در حال ویرایش هستید. پس از ذخیره، تغییرات برای بررسی به پنل مدیریت ارسال می‌شود.',
    identity: 'هویت حقوقی', identityHint: 'همان‌طور که در روزنامه‌ی رسمی ثبت شده',
    about: 'درباره‌ی سازمان', aboutHint: 'سوابق و حوزه‌ی فعالیت',
    manager: 'مدیرعامل', managerHint: 'کد ملی و موبایل مدیر قابل تغییر نیست',
    agent: 'نماینده‌ی مدیرعامل', agentHint: 'برای هماهنگی سفارش‌ها با او تماس گرفته می‌شود',
    contact: 'راه‌های تماس', contactHint: 'روی رسیدها و قراردادها نوشته می‌شود',
    address: 'نشانی سازمان', addressHint: 'کارشناس به این نشانی اعزام می‌شود',
    save: 'ارسال درخواست ویرایش', saveHint: 'تغییرات همه‌ی تب‌های اطلاعات سازمان، مدیر و تماس با هم ارسال می‌شوند.',
    docsHint: 'اختیاری: آگهی تأسیس، آخرین تغییرات یا مدارک دیگر (PDF یا تصویر)',
    usersHint: 'این افراد می‌توانند از طرف سازمان سفارش ثبت و پیگیری کنند',
    soon: 'به‌زودی فعال می‌شود', retry: 'تلاش دوباره',
    noDocs: 'هنوز مدرکی بارگذاری نشده', noDocsHint: 'بارگذاری مدارک، بررسی حساب سازمان را سریع‌تر می‌کند.',
    noUsers: 'کاربر مجازی اضافه نشده', noUsersHint: 'همکارانی را که از طرف سازمان سفارش می‌دهند اضافه کنید.',
    newUser: 'کاربر جدید',
    password: 'تغییر رمز عبور', passwordHint: 'رمز فعلی و رمز جدید را وارد کنید',
    passwordRule: 'حداقل ۸ کاراکتر؛ ترکیب حروف بزرگ و کوچک، عدد و نماد امن‌تر است.',
    protection: 'محافظت از حساب', protectionHint: 'تأیید دومرحله‌ای، دستگاه‌ها و نشست‌های فعال',
    appearance: 'ظاهر برنامه', appearanceHint: 'پوسته‌ی روشن، تیره یا هماهنگ با ویندوز',
    app: 'برنامه', appHint: 'نسخه و به‌روزرسانی',
    danger: 'ناحیه‌ی حساس', dangerHint: 'این کارها قابل بازگشت نیستند',
  },
  en: {
    kicker: 'Loop organisation account', org: 'Organisation', nationalId: 'National ID',
    completion: 'Profile completion', complete: 'The profile is complete', left: (n) => `${n} item${n === 1 ? '' : 's'} left`,
    todo: 'Finish the profile', todoDone: 'The main details are in. Receipts and contracts use them.',
    items: { logo: 'Logo', email: 'Organisation email', phone: 'Landline', region: 'Region', address: 'Address', postal: 'Postal code', birth: 'Manager’s birth date' },
    tabs: {
      org: ['Organisation', 'Name, IDs and history'],
      manager: ['Manager & representative', 'The CEO and their representative'],
      contact: ['Contact & address', 'Email, phone and address'],
      documents: ['Documents', 'Registration and changes'],
      users: ['Authorised users', 'People acting for the organisation'],
      security: ['Security & password', 'Password and two-step'],
      settings: ['Account settings', 'Appearance, version, deletion'],
    },
    status: 'Account status', editStatus: 'Edit request',
    readonlyNote: 'Organisation details change only through an edit request, applied after the admin panel reviews it.',
    editingNote: 'You are editing. After saving, the changes go to the admin panel for review.',
    identity: 'Legal identity', identityHint: 'As registered in the official gazette',
    about: 'About', aboutHint: 'History and field of work',
    manager: 'CEO', managerHint: 'The manager’s national ID and mobile can’t be changed',
    agent: 'CEO’s representative', agentHint: 'We call them to arrange orders',
    contact: 'Contact', contactHint: 'Printed on receipts and contracts',
    address: 'Address', addressHint: 'Experts are sent to this address',
    save: 'Send edit request', saveHint: 'Changes on the organisation, manager and contact tabs are sent together.',
    docsHint: 'Optional: registration notice, latest changes or other documents (PDF or image)',
    usersHint: 'These people can place and track orders for the organisation',
    soon: 'Available soon', retry: 'Try again',
    noDocs: 'No document uploaded yet', noDocsHint: 'Uploading documents speeds up the account review.',
    noUsers: 'No authorised user yet', noUsersHint: 'Add the colleagues who order for the organisation.',
    newUser: 'New user',
    password: 'Change password', passwordHint: 'Enter your current password and a new one',
    passwordRule: 'At least 8 characters; mixing cases, digits and symbols is safer.',
    protection: 'Account protection', protectionHint: 'Two-step verification, devices and sessions',
    appearance: 'Appearance', appearanceHint: 'Light, dark or follow Windows',
    app: 'App', appHint: 'Version and updates',
    danger: 'Danger zone', dangerHint: 'These can’t be undone',
  },
};

/** Loading / unavailable / error states of a useRemoteResource, else children. */
function ResourceState({ resource, copy, children }) {
  const { t } = useTranslation();
  if (resource.state === RESOURCE_STATE.LOADING || resource.state === RESOURCE_STATE.IDLE) {
    return (
      <View style={styles.skeletons}>
        <Skeleton height={58} radius={14} />
        <Skeleton height={58} radius={14} />
      </View>
    );
  }
  if (resource.state === RESOURCE_STATE.UNAVAILABLE) {
    return <EmptyState compact icon="time-outline" title={copy.soon} message={t('This feature will be available soon.')} />;
  }
  if (resource.state === RESOURCE_STATE.ERROR) {
    return (
      <EmptyState
        compact
        icon="cloud-offline-outline"
        title={resource.message || t('The operation failed. Please try again.')}
        action={<DButton title={copy.retry} icon="refresh" variant="soft" onPress={resource.reload} />}
      />
    );
  }
  return children;
}

/** One line of a list: icon, title, subtitle, actions. */
function ItemRow({ icon, title, subtitle, children }) {
  const dir = useDir();
  return (
    <View style={[styles.item, dir.row]}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={20} color={surface.brandText} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.itemTitle, dir.bold, dir.align]} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={[styles.itemSub, dir.light, dir.align]} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={[styles.itemActions, dir.row]}>{children}</View>
    </View>
  );
}

/** Same requests as the mobile OrganizationDocumentsSection. */
function DocumentsPanel({ documents, copy }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const list = Array.isArray(documents.data) ? documents.data : [];

  const pickAndUpload = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.length) return;
      setUploading(true);
      const result = await uploadDocument(picked.assets[0], picked.assets[0].name);
      setUploading(false);
      if (!result.ok) {
        showToastOrAlert(failMessage(t, result));
        return;
      }
      showToastOrAlert(result.message || t('The document was uploaded.'));
      documents.reload();
    } catch {
      setUploading(false);
      showToastOrAlert(t('The operation failed. Please try again.'));
    }
  };

  const remove = (doc) =>
    showAlert(t('Delete document'), t('Are you sure you want to delete this document?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          setBusyId(doc.id);
          const result = await deleteDocument(doc.id);
          setBusyId(null);
          if (!result.ok) {
            showToastOrAlert(failMessage(t, result));
            return;
          }
          documents.setData(list.filter((item) => item.id !== doc.id));
        },
      },
    ]);

  const upload = <DButton title={t('Upload document')} icon="cloud-upload-outline" variant="primary" loading={uploading} disabled={uploading} onPress={pickAndUpload} />;

  return (
    <PanelGroup title={t('Organization documents')} hint={copy.docsHint} icon="document-attach-outline" right={documents.state === RESOURCE_STATE.READY && list.length > 0 ? upload : null}>
      <ResourceState resource={documents} copy={copy}>
        {list.length === 0 ? (
          <EmptyState compact icon="document-attach-outline" title={copy.noDocs} message={copy.noDocsHint} action={upload} />
        ) : (
          <View style={styles.list}>
            {list.map((doc) => (
              <ItemRow
                key={String(doc.id)}
                icon={/pdf/i.test(doc.title || doc.url || '') ? 'document-text-outline' : 'image-outline'}
                title={doc.title || t('Document')}
                subtitle={[formatDateTime(doc.uploaded_at || doc.created_at), doc.status ? `${t('Status')}: ${doc.status_label || doc.status}` : null].filter(Boolean).join(' · ')}
              >
                {!!doc.url && <DButton title={t('View')} icon="open-outline" variant="outline" size="sm" onPress={() => Linking.openURL(doc.url)} />}
                <DButton title={t('Delete')} icon="trash-outline" variant="danger" size="sm" loading={busyId === doc.id} onPress={() => remove(doc)} />
              </ItemRow>
            ))}
          </View>
        )}
      </ResourceState>
    </PanelGroup>
  );
}

/** Same requests and checks as the mobile AuthorizedUsersSection. */
function UsersPanel({ users, copy }) {
  const { t } = useTranslation();
  const dir = useDir();
  const [adding, setAdding] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const list = Array.isArray(users.data) ? users.data : [];

  const add = async () => {
    const normalizedMobile = toLatinDigits(mobile).trim();
    if (fullName.trim().length < 3) {
      showToastOrAlert(t('Please enter the full name.'));
      return;
    }
    if (!IR_MOBILE.test(normalizedMobile)) {
      showToastOrAlert(t('Please enter a valid mobile number (09xxxxxxxxx).'));
      return;
    }
    setBusy(true);
    const result = await addAuthorizedUser({
      full_name: fullName.trim(),
      mobile: normalizedMobile,
      ...(role.trim() ? { role: role.trim() } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      showToastOrAlert(failMessage(t, result));
      return;
    }
    setAdding(false);
    setFullName('');
    setMobile('');
    setRole('');
    showToastOrAlert(result.message || t('The user was added.'));
    users.reload();
  };

  const remove = (user) =>
    showAlert(t('Remove user'), t('This user will no longer be able to act on behalf of the organization. Continue?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Remove'),
        style: 'destructive',
        onPress: async () => {
          setBusyId(user.id);
          const result = await removeAuthorizedUser(user.id);
          setBusyId(null);
          if (!result.ok) {
            showToastOrAlert(failMessage(t, result));
            return;
          }
          users.setData(list.filter((item) => item.id !== user.id));
        },
      },
    ]);

  const addButton = !adding && <DButton title={t('Add authorized user')} icon="person-add-outline" variant="primary" onPress={() => setAdding(true)} />;

  return (
    <PanelGroup title={t('Authorized organization users')} hint={copy.usersHint} icon="people-outline" right={users.state === RESOURCE_STATE.READY && (list.length > 0 || adding) ? addButton : null}>
      <ResourceState resource={users} copy={copy}>
        {adding && (
          <View style={styles.addBox}>
            <Text style={[styles.addTitle, dir.bold, dir.align]}>{copy.newUser}</Text>
            <FieldGrid>
              <Field label={t('Full name')} required>
                <TextField icon="person-outline" value={fullName} onChangeText={setFullName} placeholder={t('Full name')} />
              </Field>
              <Field label={t('Mobile number')} required>
                <TextField icon="phone-portrait-outline" value={mobile} onChangeText={setMobile} placeholder="09xxxxxxxxx" keyboardType="phone-pad" maxLength={11} />
              </Field>
              <Field label={t('Role / job title (optional)')} full>
                <TextField icon="briefcase-outline" value={role} onChangeText={setRole} placeholder={t('Role / job title (optional)')} />
              </Field>
            </FieldGrid>
            <View style={[styles.addActions, dir.row]}>
              <DButton title={t('Add')} icon="checkmark" variant="gold" loading={busy} disabled={busy} onPress={add} />
              <DButton title={t('Cancel')} variant="ghost" onPress={() => setAdding(false)} />
            </View>
          </View>
        )}
        {list.length === 0 && !adding ? (
          <EmptyState compact icon="people-outline" title={copy.noUsers} message={copy.noUsersHint} action={addButton} />
        ) : (
          <View style={styles.list}>
            {list.map((user) => (
              <ItemRow
                key={String(user.id)}
                icon="person-circle-outline"
                title={user.full_name || user.name || '-'}
                subtitle={[user.mobile, user.role ? `${t('Role')}: ${user.role}` : null].filter(Boolean).join(' · ')}
              >
                <DButton title={t('Remove')} icon="person-remove-outline" variant="danger" size="sm" loading={busyId === user.id} onPress={() => remove(user)} />
              </ItemRow>
            ))}
          </View>
        )}
      </ResourceState>
    </PanelGroup>
  );
}

/** Password input with the show / hide eye of the mobile screen. */
function PasswordInput({ value, onChangeText, visible, onToggle, invalid, icon = 'lock-closed-outline' }) {
  const dir = useDir();
  return (
    <View style={[styles.passwordRow, dir.row]}>
      <View style={styles.flex}>
        <TextField icon={icon} value={value} onChangeText={onChangeText} secureTextEntry={!visible} invalid={invalid} autoCapitalize="none" />
      </View>
      <IconButton icon={visible ? 'eye-outline' : 'eye-off-outline'} onPress={onToggle} color={surface.muted} size={46} label="eye" />
    </View>
  );
}

const OrganizationProfile = () => {
  const navigation = useNavigation();
  const { logoutWithConfirmation, isLoggingOut } = useLogout();
  const { t, i18n } = useTranslation();
  // Form states - مطابق با فیلدهای ثبت‌نام
  const [profileImage, setProfileImage] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [businessName, setBusinessName] = useState('');
  // شناسه‌ی ملی سازمان در ثبت‌نام با کلید `melicode` فرستاده می‌شود.
  const [organizationNationalId, setOrganizationNationalId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [economicCode, setEconomicCode] = useState('');
  const [editRequest, setEditRequest] = useState(null);
  const [savedMainData, setSavedMainData] = useState(null);

  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [history, setHistory] = useState('');

  const [familyName, setFamilyName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [organizationPhoneNumber, setOrganizationPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [organizationPostalCode, setOrganizationPostalCode] = useState('');
  const token = useSelector(state => state.auth?.token)
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errors, setErrors] = useState({});
  const [datePickerModal, setDatePickerModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadOrganizationProfile();
  }, []);

  // بارگذاری اطلاعات پروفایل
  const loadOrganizationProfile = async () => {
    try {
      setLoadingProfile(true);

      if (!token) {
        showAlert(t('Error'), t('Please log in first.'));
        navigation.navigate('Login');
        return;
      }


      const response = await axios.get(`${uri}/organization/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });


      if (response.data.status === 'success') {
        const data = response.data.data;
        setEditRequest(data?.edited_organization)
        setSavedMainData(data)
        setOrganizationName(data.organization_name || '');
        setBusinessName(data.business_name || '');
        setOrganizationNationalId(data.melicode || data.organization_national_id || data.national_id || '');
        setRegistrationNumber(data.registration_number || '');
        setEconomicCode(data.economic_code || '');
        setAgentName(data.agent_name || '');
        setAgentPhone(data.agent_phone || '');
        setHistory(data.history || '');
        setFamilyName(data.manager_full_name || '');
        setNationalCode(data.manager_national_code || '');

        if (data.manager_mobile) {
          setMobileNumber(data.manager_mobile);
        } else {

          const orgData = await AsyncStorage.getItem('organizationData');
          if (orgData) {
            const savedData = JSON.parse(orgData);
            if (savedData.manager_mobile) {
              setMobileNumber(savedData.manager_mobile);
            }
          }


        }

        setOrganizationPhoneNumber(data.organization_phone || '');
        setBirthDate(data.manager_birthdate || '');
        setOrganizationEmail(data.organization_email || '');
        setCity(data.city || '');
        setRegion(data.region_id || '');
        setOrganizationAddress(data.organization_address || '');
        setOrganizationPostalCode(data.postal_code || '');

        if (data.profile_image) {

          // بررسی: آیا URL کامل است؟
          const isFullUrl = data.profile_image.startsWith('http');

          const imageUrl = isFullUrl ? data.profile_image : `${imageUri}/${data.profile_image}`;
          setProfileImage({ uri: imageUrl, uploaded: true });
        } else {
        }

      } else {
      }
    } catch (error) {

    } finally {
      setLoadingProfile(false);
    }
  };

  // انتخاب تصویر پروفایل
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showAlert(t('Error'), t('Gallery access is required.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });


      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        setProfileImage(selectedImage);
      } else {
      }
    } catch (error) {
      showAlert(t('Error'), t('Error selecting image'));
    }
  };

  // به‌روزرسانی پروفایل
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setErrors({});

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert(t('Error'), t('Please log in first.'));
        return;
      }

      // بررسی آیا عکس جدید داریم
      const hasNewImage = profileImage && profileImage.uri && !profileImage.uri.startsWith('http');

      let requestData;
      let requestHeaders = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      if (hasNewImage) {
        const formData = new FormData();

        const uriParts = profileImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        if (Platform.OS === 'web') {
          // دسکتاپ: روی وب FormData شیء { uri } را نمی‌فهمد؛ خودِ فایل فرستاده می‌شود
          const blob = await (await fetch(profileImage.uri)).blob();
          const ext = (blob.type.split('/')[1] || 'jpeg').replace('jpeg', 'jpg');
          formData.append('profile_image', new File([blob], `profile.${ext}`, { type: blob.type }));
        } else {
          formData.append('profile_image', {
            uri: profileImage.uri,
            name: `profile.${fileType}`,
            type: `image/${fileType}`,
          });
        }

        formData.append('organization_name', organizationName);
        formData.append('business_name', businessName);
        formData.append('melicode', organizationNationalId);
        formData.append('registration_number', registrationNumber);
        formData.append('economic_code', economicCode);
        formData.append('agent_name', agentName);
        formData.append('agent_phone', agentPhone);
        formData.append('history', history);
        formData.append('organization_email', organizationEmail);
        formData.append('organization_phone', organizationPhoneNumber);
        formData.append('organization_address', organizationAddress);
        formData.append('manager_full_name', familyName);
        formData.append('city', city);
        formData.append('region', region);
        formData.append('postal_code', organizationPostalCode);

        if (birthDate) {
          // Backend تاریخ شمسی می‌خواد (مثلاً 1370/01/01)
          formData.append('manager_birthdate', birthDate);
        }

        requestData = formData;
        requestHeaders['Content-Type'] = 'multipart/form-data';
      } else {
        const jsonData = {
          organization_name: organizationName,
          business_name: businessName,
          melicode: organizationNationalId,
          registration_number: registrationNumber,
          economic_code: economicCode,
          agent_name: agentName,
          agent_phone: agentPhone,
          history: history,
          organization_email: organizationEmail,
          organization_phone: organizationPhoneNumber,
          organization_address: organizationAddress,
          manager_full_name: familyName,
          city: city,
          region: region,
          postal_code: organizationPostalCode,
        };

        if (birthDate) {
          // Backend تاریخ شمسی می‌خواد (مثلاً 1370/01/01)
          jsonData.manager_birthdate = birthDate;

        }

        requestData = jsonData;
        requestHeaders['Content-Type'] = 'application/json';
      }



      // همیشه از POST استفاده کن
      const response = await axios.post(
        `${uri}/organization/update-profile`,
        requestData,
        {
          headers: requestHeaders,
          timeout: 30000,
        }
      );


      if (response.data.status === 'success') {
        const responseData = response.data.data;


        // بررسی تصویر در پاسخ
        if (responseData?.profile_image) {

          const isFullUrl = responseData.profile_image.startsWith('http');
          const newImageUrl = isFullUrl ? responseData.profile_image : `${uri}/storage/${responseData.profile_image}`;

          setProfileImage({ uri: newImageUrl, uploaded: true });
        }

        // رسید آدرس/تلفن ثابت/شناسه ملی را از همین پروفایل می‌خواند و نتیجه را
        // کش می‌کند؛ بدون این، رسید تا ری‌لود بعدی مقدار قدیمی را نشان می‌داد.
        clearAccountProfileCache();
        showAlert(t('Success'), t('Profile updated successfully.'));
        setIsEditing(false);
        // بارگذاری مجدد اطلاعات
        await loadOrganizationProfile();
      }
    } catch (error) {
      // چک کردن خطاهای مختلف
      if (error.response?.status === 405) {
        const errorMessage = error.response?.data?.message || '';
        const method = errorMessage.includes('POST') ? 'POST' : 'PUT';

        showAlert(
          t('⚠️ Update is not enabled yet'),
          t('Unfortunately, the backend has not enabled organizational profile editing yet.\n\n📋 Current status:\n✅ View profile: enabled\n❌ Edit profile: disabled\n\n🔧 Required backend endpoint:\n• POST /api/organization/profile (with _method=PUT)\n• or PUT /api/organization/profile\n\n📞 Please coordinate with the backend team to enable this endpoint.'),
          [{
            text: t('Got it'),
            onPress: () => {
              setIsEditing(false);
              loadOrganizationProfile();
            }
          }]
        );
      } else if (error.response?.status === 422 && error.response?.data?.errors) {
        // نمایش خطاهای validation
        const errors = error.response.data.errors;
        const errorList = Object.keys(errors).map(key => `• ${errors[key].join('\n• ')}`).join('\n');
        showAlert(t('Validation error'), errorList);
      } else if (error.response?.status === 404) {
        showAlert(t('Error'), t('Organization information not found.'));
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        showAlert(t('Error'), t('Unauthorized access. Please login.'));
      } else {
        const errorMessage = error.response?.data?.message || t('Error updating profile');
        showAlert(t('Error'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // تغییر رمز عبور
  const handleChangePassword = async () => {
    try {
      // اعتبارسنجی
      const newErrors = {};

      if (!currentPassword) {
        newErrors.currentPassword = t('Current password is required');
      }

      if (!newPassword) {
        newErrors.newPassword = t('New password is required');
      } else if (newPassword.length < 8) {
        newErrors.newPassword = t('New password must be at least 8 characters');
      }

      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = t('Password and repeat password do not match.');
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);


      if (!token) {
        showAlert(t('Error'), t('Please log in first.'));
        setLoading(false);
        return;
      }


      const response = await axios.patch(
        `${uri}/profile/password`,
        {
          current_password: currentPassword,
          password: newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }
      );


      if (response.data.success) {
        showAlert(t('Success'), response.data.message || t('Password changed successfully.'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('Error changing password');
      showAlert(t('Error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // همان کارِ دکمه‌ی «درخواست ویرایش / انصراف» موبایل
  const toggleEditing = () => {

    if (editRequest && !isEditing) {
      setOrganizationName(editRequest.organization_name || '');
      setBusinessName(editRequest.business_name || '');
      setOrganizationNationalId(editRequest.melicode || editRequest.organization_national_id || editRequest.national_id || '');
      setRegistrationNumber(editRequest.registration_number || '');
      setEconomicCode(editRequest.economic_code || '');
      setAgentName(editRequest.agent_name || '');
      setAgentPhone(editRequest.agent_phone || '');
      setHistory(editRequest.history || '');
      setFamilyName(editRequest.manager_full_name || '');
      setOrganizationPhoneNumber(editRequest.organization_phone || '');
      setBirthDate(editRequest.manager_birthdate || '');
      setOrganizationEmail(editRequest.organization_email || '');
      setCity(editRequest.city || '');
      setRegion(editRequest.region_id || '');
      setOrganizationAddress(editRequest.organization_address || '');
      setOrganizationPostalCode(editRequest.postal_code || '');
      // بررسی: آیا URL کامل است؟
      if (editRequest?.profile_image) {

        const isFullUrl = editRequest.profile_image.startsWith('http');

        const imageUrl = isFullUrl ? editRequest.profile_image : `${imageUri}/${editRequest.profile_image}`;
        setProfileImage({ uri: imageUrl, uploaded: true });
      }
      setIsEditing(true);
    } else if (isEditing) {
      setOrganizationName(savedMainData.organization_name || '');
      setBusinessName(savedMainData.business_name || '');
      setOrganizationNationalId(savedMainData.melicode || savedMainData.organization_national_id || savedMainData.national_id || '');
      setRegistrationNumber(savedMainData.registration_number || '');
      setEconomicCode(savedMainData.economic_code || '');
      setAgentName(savedMainData.agent_name || '');
      setAgentPhone(savedMainData.agent_phone || '');
      setHistory(savedMainData.history || '');
      setFamilyName(savedMainData.manager_full_name || '');
      setOrganizationPhoneNumber(savedMainData.organization_phone || '');
      setBirthDate(savedMainData.manager_birthdate || '');
      setOrganizationEmail(savedMainData.organization_email || '');
      setCity(savedMainData.city || '');
      setRegion(savedMainData.region_id || '');
      setOrganizationAddress(savedMainData.organization_address || '');
      setOrganizationPostalCode(savedMainData.postal_code || '');
      // بررسی: آیا URL کامل است؟
      if (savedMainData?.profile_image) {

        const isFullUrl = savedMainData.profile_image.startsWith('http');

        const imageUrl = isFullUrl ? savedMainData.profile_image : `${imageUri}/${savedMainData.profile_image}`;
        setProfileImage({ uri: imageUrl, uploaded: true });
      }
      setIsEditing(false);
    } else if (!editRequest) {

      setIsEditing(!isEditing);
    }
  };

  // دسکتاپ: تب فعال؛ مدارک و کاربران همین‌جا خوانده می‌شوند تا شمارشان کنار تب‌ها باشد
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const [tab, setTab] = useState('org');
  const accountRows = useAccountRows(navigation, { isOrganization: true });
  const documents = useRemoteResource(listDocuments);
  const users = useRemoteResource(listAuthorizedUsers);
  const accessProfileStatus = useSelector((state) => state?.organization?.profileStatus);
  useEffect(() => {
    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) setTab('security');
  }, [errors]);

  if (loadingProfile) {
    return (
      <View style={styles.screen}>
        <ScreenHeaders title={t('Organization profile')} />
        <View style={styles.loading}>
          <Spinner label={t('Loading...')} />
        </View>
      </View>
    );
  }

  const status = resolveVerificationStatus(savedMainData, accessProfileStatus);
  const statusView = STATUS_VIEW[status];
  const reason = savedMainData?.verification_reason || savedMainData?.rejection_reason;
  const editView = !editRequest
    ? null
    : editRequest?.status == 0
      ? { kind: 'warning', icon: 'time-outline', label: t('Awaiting review of changes') }
      : editRequest?.status == 1
        ? { kind: 'success', icon: 'checkmark-circle', label: t('Approved') }
        : { kind: 'danger', icon: 'close-circle', label: t('Rejected') };

  // پیشرفت پروفایل: اطلاعاتی که روی رسید، قرارداد و اعزام کارشناس اثر دارند
  const checklist = [
    { key: 'logo', done: !!profileImage, tab: 'org' },
    { key: 'email', done: !!organizationEmail, tab: 'contact' },
    { key: 'phone', done: !!organizationPhoneNumber, tab: 'contact' },
    { key: 'region', done: !!region, tab: 'contact' },
    { key: 'address', done: !!organizationAddress, tab: 'contact' },
    { key: 'postal', done: !!organizationPostalCode, tab: 'contact' },
    { key: 'birth', done: !!birthDate, tab: 'manager' },
  ];
  const percent = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
  const missing = checklist.filter((item) => !item.done);
  const countOf = (resource) =>
    resource.state === RESOURCE_STATE.READY && Array.isArray(resource.data) ? resource.data.length : null;

  const tabIcons = {
    org: 'business-outline',
    manager: 'person-outline',
    contact: 'location-outline',
    documents: 'document-attach-outline',
    users: 'people-outline',
    security: 'shield-checkmark-outline',
    settings: 'settings-outline',
  };
  const tabs = [
    { key: 'org', done: !!(organizationName && organizationNationalId) },
    { key: 'manager', done: !!(familyName && birthDate) },
    { key: 'contact', done: checklist.slice(1, 6).every((item) => item.done) },
    { key: 'documents', badge: countOf(documents) },
    { key: 'users', badge: countOf(users) },
    { key: 'security', error: !!(errors.currentPassword || errors.newPassword || errors.confirmPassword) },
    { key: 'settings' },
  ].map((item) => ({ ...item, icon: tabIcons[item.key], title: copy.tabs[item.key][0], hint: copy.tabs[item.key][1] }));
  const active = tabs.find((item) => item.key === tab) || tabs[0];
  const infoTab = ['org', 'manager', 'contact'].includes(active.key);

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t('Organization profile')} />
      <ProfileLayout
        banner={
          <ProfileBanner
            image={profileImage?.uri || null}
            fallbackIcon="business"
            onPickImage={isEditing ? pickImage : undefined}
            kicker={copy.kicker}
            name={organizationName || t('Organization profile')}
            pills={[
              { label: copy.org, icon: 'business' },
              ...(statusView ? [{ label: t(statusView.label), kind: statusView.kind, icon: statusView.icon }] : []),
            ]}
            meta={[
              { icon: 'person-outline', text: familyName },
              { icon: 'call-outline', text: organizationPhoneNumber },
              { icon: 'mail-outline', text: organizationEmail },
            ]}
            code={{ label: copy.nationalId, value: organizationNationalId }}
            progress={{ percent, title: copy.completion, hint: missing.length ? copy.left(missing.length) : copy.complete }}
          />
        }
        side={
          <>
            <ProfileNav tabs={tabs} active={active.key} onChange={setTab} />
            <SideCard title={copy.status} icon="ribbon-outline">
              <View style={[styles.statusRow, dir.row]}>
                <Text style={[styles.statusLabel, dir.light]}>{t('Organization verification status')}</Text>
                {statusView ? (
                  <Pill label={t(statusView.label)} kind={statusView.kind} icon={statusView.icon} size="sm" />
                ) : (
                  <Text style={[styles.statusLabel, dir.bold]}>{t('Not determined yet')}</Text>
                )}
              </View>
              {!!reason && status !== VERIFICATION_STATUS.APPROVED && (
                <Text style={[styles.reason, dir.light, dir.align]}>{reason}</Text>
              )}
              {!!editView && (
                <View style={[styles.statusRow, dir.row]}>
                  <Text style={[styles.statusLabel, dir.light]}>{copy.editStatus}</Text>
                  <Pill label={editView.label} kind={editView.kind} icon={editView.icon} size="sm" />
                </View>
              )}
            </SideCard>
            <ChecklistCard
              title={copy.todo}
              percent={percent}
              doneText={copy.todoDone}
              items={missing.map((item) => ({ key: item.key, label: copy.items[item.key], onPress: () => setTab(item.tab) }))}
            />
            <SignOutButton title={t('Log out of account')} onPress={logoutWithConfirmation} disabled={isLoggingOut} />
          </>
        }
      >
        <ProfilePanel
          key={active.key}
          icon={active.icon}
          title={active.title}
          hint={active.hint}
          right={
            infoTab && (
              <DButton
                title={isEditing ? t('Cancel') : t('Edit request')}
                icon={isEditing ? 'close' : 'create-outline'}
                variant={isEditing ? 'ghost' : 'soft'}
                onPress={toggleEditing}
              />
            )
          }
          footer={
            infoTab && isEditing && (
              <SaveBar hint={copy.saveHint}>
                <DButton
                  title={loading ? t('Saving...') : copy.save}
                  icon="paper-plane-outline"
                  variant="gold"
                  size="lg"
                  onPress={handleUpdateProfile}
                  disabled={loading}
                  loading={loading}
                />
              </SaveBar>
            )
          }
        >
          {infoTab && (
            <PanelNote icon={isEditing ? 'create-outline' : 'lock-closed-outline'} kind={isEditing ? 'gold' : 'brand'}>
              {isEditing ? copy.editingNote : copy.readonlyNote}
            </PanelNote>
          )}

          {active.key === 'org' && (
            <>
              <PanelGroup
                title={copy.identity}
                hint={copy.identityHint}
                icon="id-card-outline"
                right={isEditing && (
                  <DButton title={profileImage ? t('Change image') : t('Select image')} icon="image-outline" variant="outline" size="sm" onPress={pickImage} />
                )}
              >
                <FieldGrid>
                  <Field label={t('Organization name *')}>
                    <TextField icon="business-outline" value={organizationName} onChangeText={setOrganizationName} editable={isEditing} />
                  </Field>
                  <Field label={t('Business name')}>
                    <TextField icon="storefront-outline" value={businessName} onChangeText={setBusinessName} editable={isEditing} />
                  </Field>
                  <Field label={t('Organization national ID')}>
                    <TextField icon="finger-print-outline" value={organizationNationalId} onChangeText={setOrganizationNationalId} editable={isEditing} keyboardType="number-pad" />
                  </Field>
                  <Field label={t('Company registration number')}>
                    <TextField icon="document-outline" value={registrationNumber} onChangeText={setRegistrationNumber} editable={isEditing} keyboardType="number-pad" />
                  </Field>
                  <Field label={t('Economic code (optional)')}>
                    <TextField icon="barcode-outline" value={economicCode} onChangeText={setEconomicCode} editable={isEditing} keyboardType="number-pad" />
                  </Field>
                </FieldGrid>
              </PanelGroup>
              <PanelGroup title={copy.about} hint={copy.aboutHint} icon="reader-outline">
                <Field label={t('Records')}>
                  <TextField multiline rows={4} value={history} onChangeText={setHistory} editable={isEditing} />
                </Field>
              </PanelGroup>
            </>
          )}

          {active.key === 'manager' && (
            <>
              <PanelGroup title={copy.manager} hint={copy.managerHint} icon="person-outline">
                <FieldGrid>
                  <Field label={t('Manager full name *')}>
                    <TextField icon="person-outline" value={familyName} onChangeText={setFamilyName} editable={isEditing} />
                  </Field>
                  <Field label={t('Manager date of birth')}>
                    <SelectField value={birthDate} placeholder={t('Select Date')} onPress={isEditing ? () => setDatePickerModal(true) : undefined} />
                  </Field>
                  <Field label={t('Manager national ID')}>
                    <TextField icon="lock-closed-outline" value={nationalCode} editable={false} />
                  </Field>
                  <Field label={t('Manager mobile number')}>
                    <TextField icon="lock-closed-outline" value={mobileNumber} editable={false} />
                  </Field>
                </FieldGrid>
              </PanelGroup>
              <PanelGroup title={copy.agent} hint={copy.agentHint} icon="people-outline">
                <FieldGrid>
                  <Field label={t("Name of the CEO's representative")}>
                    <TextField icon="person-outline" value={agentName} onChangeText={setAgentName} editable={isEditing} />
                  </Field>
                  <Field label={t('CEO Representative Phone')}>
                    <TextField icon="phone-portrait-outline" value={agentPhone} onChangeText={setAgentPhone} editable={isEditing} keyboardType="phone-pad" maxLength={11} />
                  </Field>
                </FieldGrid>
              </PanelGroup>
            </>
          )}

          {active.key === 'contact' && (
            <>
              <PanelGroup title={copy.contact} hint={copy.contactHint} icon="call-outline">
                <FieldGrid>
                  <Field label={t('Organization email *')}>
                    <TextField icon="mail-outline" value={organizationEmail} onChangeText={setOrganizationEmail} editable={isEditing} keyboardType="email-address" autoCapitalize="none" />
                  </Field>
                  <Field label={t('Organization landline *')}>
                    <TextField icon="call-outline" unit="021" value={organizationPhoneNumber} onChangeText={setOrganizationPhoneNumber} editable={isEditing} keyboardType="phone-pad" />
                  </Field>
                </FieldGrid>
              </PanelGroup>
              <PanelGroup title={copy.address} hint={copy.addressHint} icon="map-outline">
                <FieldGrid>
                  <Field label={t('Region *')}>
                    <TextField icon="navigate-outline" value={String(region ?? '')} onChangeText={setRegion} editable={isEditing} keyboardType="number-pad" />
                  </Field>
                  <Field label={t('Organization postal code *')}>
                    <TextField icon="mail-unread-outline" value={organizationPostalCode} onChangeText={setOrganizationPostalCode} editable={isEditing} keyboardType="numeric" maxLength={10} />
                  </Field>
                  <Field label={t('Organization address *')} full>
                    <TextField icon="home-outline" multiline rows={3} value={organizationAddress} onChangeText={setOrganizationAddress} editable={isEditing} />
                  </Field>
                </FieldGrid>
              </PanelGroup>
            </>
          )}

          {active.key === 'documents' && <DocumentsPanel documents={documents} copy={copy} />}

          {active.key === 'users' && <UsersPanel users={users} copy={copy} />}

          {active.key === 'security' && (
            <>
              <PanelGroup title={copy.password} hint={copy.passwordHint} icon="key-outline">
                <FieldGrid>
                  <Field label={t('Current password')} error={errors.currentPassword} full>
                    <PasswordInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      visible={showCurrentPassword}
                      onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                      invalid={!!errors.currentPassword}
                    />
                  </Field>
                  <Field label={t('New password')} error={errors.newPassword}>
                    <PasswordInput
                      icon="key-outline"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      visible={showNewPassword}
                      onToggle={() => setShowNewPassword(!showNewPassword)}
                      invalid={!!errors.newPassword}
                    />
                    <StrengthMeter value={newPassword} />
                  </Field>
                  <Field label={t('Confirm new password')} error={errors.confirmPassword} hint={copy.passwordRule}>
                    <PasswordInput
                      icon="key-outline"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      visible={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                      invalid={!!errors.confirmPassword}
                    />
                  </Field>
                </FieldGrid>
                <View style={[styles.groupActions, dir.row]}>
                  <DButton
                    title={t('Change Password')}
                    icon="key"
                    variant="primary"
                    onPress={handleChangePassword}
                    disabled={loading}
                    loading={loading}
                  />
                </View>
              </PanelGroup>
              <PanelGroup title={copy.protection} hint={copy.protectionHint} icon="finger-print-outline">
                <LinkRows rows={[accountRows.security, accountRows.twoFactor]} />
              </PanelGroup>
            </>
          )}

          {active.key === 'settings' && (
            <>
              <PanelGroup title={copy.appearance} hint={copy.appearanceHint} icon="color-palette-outline">
                <ThemeSwitch />
              </PanelGroup>
              <PanelGroup title={copy.app} hint={copy.appHint} icon="apps-outline">
                <LinkRows rows={[accountRows.update]} />
              </PanelGroup>
              <DangerZone>
                <PanelGroup title={copy.danger} hint={copy.dangerHint} icon="warning-outline">
                  <LinkRows rows={[accountRows.remove]} />
                </PanelGroup>
              </DangerZone>
            </>
          )}
        </ProfilePanel>
      </ProfileLayout>

      {/* DatePicker Modal */}
      <DatePickerModal
        datePickerModal={datePickerModal}
        setDatePickerModal={setDatePickerModal}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1, minWidth: 0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  groupActions: { justifyContent: 'flex-end' },

  statusRow: { alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 4, flexWrap: 'wrap' },
  statusLabel: { fontSize: 12.5, color: surface.muted },
  reason: { fontSize: 12.5, color: surface.muted, lineHeight: 21 },

  skeletons: { gap: 10 },
  list: { gap: 10 },
  item: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: surface.cardMuted,
    borderWidth: 1,
    borderColor: surface.border,
    transitionProperty: 'border-color',
    transitionDuration: motion.fast,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.brandTint,
  },
  itemTitle: { fontSize: 14, color: surface.title },
  itemSub: { fontSize: 12, color: surface.faint, marginTop: 2 },
  itemActions: { gap: 8, alignItems: 'center' },

  addBox: {
    gap: 14,
    padding: 18,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: surface.borderStrong,
    backgroundColor: tone.gold.bg,
  },
  addTitle: { fontSize: 14, color: surface.title },
  addActions: { gap: 10 },

  passwordRow: { alignItems: 'center', gap: 8 },
});

export default OrganizationProfile;
