/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/TrainingRegistrationScreen.js
 *
 * Training-course registration as a desktop form (@desktop/FormKit): four
 * sections — the course, computer skills, personal details, facilities —
 * with every choice shown as option cards instead of hidden in drop-downs,
 * personal details in two columns, and a live completion meter in the side
 * column.
 *
 * Same options, state, validation, payload and request as the mobile file
 * (`educationRegistrationAPI.create`, the same messages, the form reset
 * after success).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import CalendarPicker from "@components/calendar/CalendarPicker";
import moment from "moment-jalaali";

import ScreenHeaders from "@components/ScreenHeaders";
import { colors } from "@theme/Color";
import { educationRegistrationAPI } from "@services/Api";
import { showToastOrAlert } from "@helpers/Common";

import { DButton, formatNumber, useDir } from "@desktop/ui";
import { ChoiceGroup, Field, FieldGrid, FormPage, FormSection, SelectField, TextField, TipsCard } from "@desktop/FormKit";
import { elevation, gradients, motion, onDark, palette, radii, surface } from "@desktop/desktopTheme";

const COURSE_OPTIONS = [
  { labelKey: "Computer Software Installation Training", value: "آموزش نصب نرم افزار رایانه" },
  { labelKey: "Computer Hardware Training", value: "آموزش سخت افزار رایانه" },
];

const REGISTER_AS_OPTIONS = [
  { labelKey: "Computer Software Technician", value: "تکنسین نرم افزار رایانه" },
  { labelKey: "Computer Hardware Technician", value: "تکنسین سخت افزار رایانه" },
  { labelKey: "I do not intend to register right now", value: "فعلا قصد ندارم" },
  { labelKey: "None of them", value: "هیچ کدام" },
];

const LEVEL_OPTIONS = [
  { labelKey: "Excellent", value: "عالی" },
  { labelKey: "Good", value: "خوب" },
  { labelKey: "Average", value: "متوسط" },
  { labelKey: "Weak", value: "ضعیف" },
  { labelKey: "I have no knowledge of computers", value: "هیچ اطلاعاتی از رایانه ندارم" },
];

const GOAL_OPTIONS = [
  { labelKey: "Yes, as a software technician", value: "بله، تکنسین نرم افزار" },
  { labelKey: "Yes, as a hardware technician", value: "بله، تکنسین سخت افزار" },
  { labelKey: "Yes, both", value: "بله، هردو مورد" },
  { labelKey: "No, only training classes", value: "خیر، فقط کلاس های آموزشی" },
];

const MARRIAGE_OPTIONS = [
  { labelKey: "Single", value: "مجرد" },
  { labelKey: "Married", value: "متأهل" },
];

const GENDER_OPTIONS = [
  { labelKey: "Female", value: "خانم" },
  { labelKey: "Male", value: "آقا" },
];

const NATIONALITY_OPTIONS = [
  { labelKey: "Iranian", value: "ایرانی" },
  { labelKey: "Foreign", value: "خارجی" },
];

const VEHICLE_OPTIONS = [
  { labelKey: "Motorcycle", value: "موتور سیکلت" },
  { labelKey: "Car", value: "خودرو" },
  { labelKey: "None", value: "ندارم" },
];

const CERTIFICATE_OPTIONS = [
  { labelKey: "Motorcycle", value: "موتور سیکلت" },
  { labelKey: "Car", value: "ماشین" },
  { labelKey: "None", value: "ندارم" },
];

const convertJalaliToGregorian = (jalaliDate) => {
  try {
    return moment(jalaliDate, "jYYYY/jMM/jDD").format("YYYY-MM-DD");
  } catch (e) {
    return "";
  }
};

export default function TrainingRegistrationScreen() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    selected_class: "",
    register_as: "",
    mastery_soft_level: "",
    mastery_hard_level: "",
    goal: "",
    name: "",
    lname: "",
    birth_date: "",
    marriage: "",
    gender: "",
    nationality: "ایرانی",
    education: "",
    phone: "",
    telephone: "",
    address: "",
    vehicle: "",
    certificate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [openSelect, setOpenSelect] = useState(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSelect = (name) => {
    setOpenSelect((prev) => (prev === name ? null : name));
  };

  const validatePhone = (phone) => /^09[0-9]{9}$/.test(phone);
  const validateTelephone = (telephone) => /^[0-9]{8}$/.test(telephone);

  const jalaliBirthDate = form.birth_date
    ? moment(form.birth_date, "YYYY-MM-DD").format("jYYYY/jMM/jDD")
    : "";

  const handleSubmit = async () => {
    if (!form.selected_class) return showToastOrAlert(t("Please select a class"));
    if (!form.register_as) return showToastOrAlert(t("Please select registration type"));
    if (!form.mastery_soft_level) return showToastOrAlert(t("Please select software skill level"));
    if (!form.mastery_hard_level) return showToastOrAlert(t("Please select hardware skill level"));
    if (!form.goal) return showToastOrAlert(t("Please select your goal"));
    if (!form.name.trim()) return showToastOrAlert(t("Please enter your first name"));
    if (!form.lname.trim()) return showToastOrAlert(t("Please enter your last name"));
    if (!form.birth_date.trim()) return showToastOrAlert(t("Please select your birth date"));
    if (!form.marriage) return showToastOrAlert(t("Please select marital status"));
    if (!form.gender) return showToastOrAlert(t("Please select gender"));
    if (!form.nationality) return showToastOrAlert(t("Please select nationality"));
    if (!form.education.trim()) return showToastOrAlert(t("Please enter education"));
    if (!form.phone.trim()) return showToastOrAlert(t("Please enter mobile number"));
    if (!form.vehicle.trim()) return showToastOrAlert(t("Please specify the condition of your vehicle."));
    if (!form.certificate.trim()) return showToastOrAlert(t("Please specify your certification status."));
    if (!validatePhone(form.phone.trim())) return showToastOrAlert(t("Invalid mobile number format"));
    if (form.telephone.trim() && !validateTelephone(form.telephone.trim())) {
      return showToastOrAlert(t("Invalid telephone number format"));
    }
    if (!form.address.trim()) return showToastOrAlert(t("Please enter address"));

    try {
      setIsSubmitting(true);

      const payload = {
        class: form.selected_class,
        register_as: form.register_as,
        mastery_soft_level: form.mastery_soft_level,
        mastery_hard_level: form.mastery_hard_level,
        goal: form.goal,
        name: form.name.trim(),
        lname: form.lname.trim(),
        birth_date: form.birth_date.trim(),
        marriage: form.marriage,
        gender: form.gender,
        nationality: form.nationality,
        education: form.education.trim(),
        phone: form.phone.trim(),
        telephone: form.telephone.trim() || undefined,
        address: form.address.trim(),
        vehicle: form.vehicle || undefined,
        certificate: form.certificate || undefined,
      };

      const response = await educationRegistrationAPI.create(payload);

      if (response.success) {
        showToastOrAlert(response.message || t("Information submitted successfully"));

        setForm({
          selected_class: "",
          register_as: "",
          mastery_soft_level: "",
          mastery_hard_level: "",
          goal: "",
          name: "",
          lname: "",
          birth_date: "",
          marriage: "",
          gender: "",
          nationality: "ایرانی",
          education: "",
          phone: "",
          telephone: "",
          address: "",
          vehicle: "",
          certificate: "",
        });

        setShowBirthDatePicker(false);
        setOpenSelect(null);
      }
    } catch (error) {
      const resp = error.response?.data;
      let errorMessage = t("Error submitting request");

      if (resp) {
        if (resp.message) {
          errorMessage = resp.message;
        } else if (resp.error_code) {
          errorMessage = resp.error_code;
        } else if (resp.errors && typeof resp.errors === "object") {
          const firstKey = Object.keys(resp.errors)[0];
          const errs = resp.errors[firstKey];
          errorMessage = Array.isArray(errs) ? errs.join("\n") : String(errs);
        }
      } else {
        errorMessage = error.message || errorMessage;
      }

      showToastOrAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dir = useDir();
  const fa = i18n.language === "fa";
  const copy = fa
    ? {
        subtitle: "در دوره‌های آموزشی نرم‌افزار و سخت‌افزار رایانه‌ی لوپ ثبت‌نام کنید؛ پس از تکمیل دوره، امکان همکاری به‌عنوان تکنسین هم وجود دارد.",
        course: "مشخصات دوره",
        courseHint: "دوره و نقشی که برایش ثبت‌نام می‌کنید",
        skills: "مهارت کار با رایانه",
        skillsHint: "سطح فعلی‌تان را صادقانه انتخاب کنید تا در کلاس مناسب قرار بگیرید",
        personal: "اطلاعات شخصی",
        personalHint: "برای تماس و صدور گواهی دوره",
        facilities: "امکانات",
        facilitiesHint: "برای همکاری میدانی پس از دوره",
        progress: "پیشرفت فرم",
        progressText: (n, total) => `${n} از ${total} مورد الزامی تکمیل شده`,
        tips: "پیش از ارسال",
        tipItems: ["شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد", "تلفن ثابت ۸ رقمی و بدون کد شهر است", "پس از بررسی، برای تعیین زمان کلاس با شما تماس می‌گیریم"],
        actionsHint: "همه‌ی موارد ستاره‌دار الزامی‌اند.",
        badges: ["۴ بخش", "حدود ۳ دقیقه"],
      }
    : {
        subtitle: "Sign up for Loop’s computer software and hardware courses; after the course you can also work with us as a technician.",
        course: "Course",
        courseHint: "The course and the role you’re registering for",
        skills: "Computer skills",
        skillsHint: "Pick your current level honestly so we place you in the right class",
        personal: "Personal details",
        personalHint: "For contact and your course certificate",
        facilities: "Facilities",
        facilitiesHint: "For field work after the course",
        progress: "Form progress",
        progressText: (n, total) => `${n} of ${total} required items done`,
        tips: "Before you submit",
        tipItems: ["The mobile number starts with 09 and has 11 digits", "The landline has 8 digits, without the area code", "After review we’ll call you to schedule the class"],
        actionsHint: "All starred items are required.",
        badges: ["4 sections", "About 3 minutes"],
      };

  const opts = (list, icons) => list.map((item, i) => ({ value: item.value, label: t(item.labelKey), icon: icons?.[i] }));
  const required = ["selected_class", "register_as", "mastery_soft_level", "mastery_hard_level", "goal", "name", "lname", "birth_date", "marriage", "gender", "nationality", "education", "phone", "address", "vehicle", "certificate"];
  const filled = required.filter((key) => String(form[key] || "").trim()).length;
  const percent = Math.round((filled / required.length) * 100);

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Registration for Training Courses")} />
      <FormPage
        hero={{
          icon: "school-outline",
          title: t("Registration for Training Courses"),
          subtitle: copy.subtitle,
          badges: [
            { icon: "layers-outline", label: copy.badges[0] },
            { icon: "time-outline", label: copy.badges[1] },
          ],
        }}
        actionsHint={copy.actionsHint}
        actions={<DButton title={t("Submit")} icon="send" variant="gold" size="lg" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting} />}
        aside={
          <>
            <View style={styles.progress}>
              <View style={styles.progressStars} pointerEvents="none" />
              <View style={[styles.progressHead, dir.row]}>
                <Text style={[styles.progressTitle, dir.bold, dir.align]}>{copy.progress}</Text>
                <Text style={[styles.progressPct, dir.bold]}>{formatNumber(percent, dir.lang)}٪</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%` }, dir.rtl && styles.fillRtl]} />
              </View>
              <Text style={[styles.progressText, dir.light, dir.align]}>
                {copy.progressText(formatNumber(filled, dir.lang), formatNumber(required.length, dir.lang))}
              </Text>
            </View>
            <TipsCard title={copy.tips} items={copy.tipItems} />
          </>
        }
      >
        <FormSection index={0} icon="ribbon-outline" title={copy.course} subtitle={copy.courseHint}>
          <Field label={t("Register in Classes *")} full>
            <ChoiceGroup
              options={opts(COURSE_OPTIONS, ["desktop-outline", "hardware-chip-outline"])}
              value={form.selected_class}
              onChange={(value) => handleChange("selected_class", value)}
              columns={2}
            />
          </Field>
          <Field label={t("Register As *")} full>
            <ChoiceGroup
              options={opts(REGISTER_AS_OPTIONS)}
              value={form.register_as}
              onChange={(value) => handleChange("register_as", value)}
              columns={2}
            />
          </Field>
        </FormSection>

        <FormSection index={1} icon="speedometer-outline" title={copy.skills} subtitle={copy.skillsHint}>
          <Field label={t("Software (Windows and software installation):")} full>
            <ChoiceGroup compact options={opts(LEVEL_OPTIONS)} value={form.mastery_soft_level} onChange={(value) => handleChange("mastery_soft_level", value)} columns={3} />
          </Field>
          <Field label={t("Hardware (Troubleshooting and fixing):")} full>
            <ChoiceGroup compact options={opts(LEVEL_OPTIONS)} value={form.mastery_hard_level} onChange={(value) => handleChange("mastery_hard_level", value)} columns={3} />
          </Field>
          <Field label={t("After completing the training and becoming fully skilled, are you willing to be employed as a field technician?")} full>
            <ChoiceGroup options={opts(GOAL_OPTIONS)} value={form.goal} onChange={(value) => handleChange("goal", value)} columns={2} />
          </Field>
        </FormSection>

        <FormSection index={2} icon="person-outline" title={copy.personal} subtitle={copy.personalHint}>
          <FieldGrid>
            <Field label={t("First Name")} required>
              <TextField icon="person-outline" placeholder={t("First Name")} value={form.name} onChangeText={(text) => handleChange("name", text)} />
            </Field>
            <Field label={t("Last Name")} required>
              <TextField icon="people-outline" placeholder={t("Last Name")} value={form.lname} onChangeText={(text) => handleChange("lname", text)} />
            </Field>
            <Field label={t("Birth Date *")} full={showBirthDatePicker}>
              <SelectField
                value={form.birth_date}
                placeholder={t("Select birth date")}
                chevron={showBirthDatePicker ? "chevron-up" : "chevron-down"}
                onPress={() => {
                  setShowBirthDatePicker((prev) => !prev);
                  setOpenSelect(null);
                }}
              />
              {showBirthDatePicker && (
                <View style={styles.calendar}>
                  <CalendarPicker
                    calendar="jalaali"
                    value={form.birth_date}
                    // تاریخ تولد نمی‌تواند در آینده باشد.
                    maximumDate={new Date()}
                    accentColor={colors.accent.color}
                    onSelect={(date) => {
                      handleChange("birth_date", date);
                    }}
                  />
                </View>
              )}
            </Field>
            <Field label={t("Education")} required>
              <TextField icon="school-outline" placeholder={t("Education")} value={form.education} onChangeText={(text) => handleChange("education", text)} />
            </Field>
            <Field label={t("Marital Status *")}>
              <ChoiceGroup compact options={opts(MARRIAGE_OPTIONS)} value={form.marriage} onChange={(value) => handleChange("marriage", value)} columns={2} />
            </Field>
            <Field label={t("Gender *")}>
              <ChoiceGroup compact options={opts(GENDER_OPTIONS, ["woman-outline", "man-outline"])} value={form.gender} onChange={(value) => handleChange("gender", value)} columns={2} />
            </Field>
            <Field label={t("Nationality *")}>
              <ChoiceGroup compact options={opts(NATIONALITY_OPTIONS)} value={form.nationality} onChange={(value) => handleChange("nationality", value)} columns={2} />
            </Field>
            <Field label={t("Mobile Number")} required>
              <TextField icon="phone-portrait-outline" placeholder="09XXXXXXXXX" value={form.phone} onChangeText={(text) => handleChange("phone", text)} keyboardType="phone-pad" maxLength={11} />
            </Field>
            <Field label={t("Telephone Number")}>
              <TextField icon="call-outline" unit="021" placeholder={t("Telephone Number")} value={form.telephone} onChangeText={(text) => handleChange("telephone", text)} keyboardType="phone-pad" maxLength={8} />
            </Field>
            <Field label={t("Residential Address")} required full>
              <TextField icon="home-outline" multiline rows={3} placeholder={t("Residential Address")} value={form.address} onChangeText={(text) => handleChange("address", text)} />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection index={3} icon="car-outline" title={copy.facilities} subtitle={copy.facilitiesHint}>
          <FieldGrid>
            <Field label={t("Do you have a vehicle?")}>
              <ChoiceGroup compact options={opts(VEHICLE_OPTIONS, ["bicycle-outline", "car-outline", "close-circle-outline"])} value={form.vehicle} onChange={(value) => handleChange("vehicle", value)} columns={1} />
            </Field>
            <Field label={t("Do you have a driving license?")}>
              <ChoiceGroup compact options={opts(CERTIFICATE_OPTIONS, ["bicycle-outline", "car-outline", "close-circle-outline"])} value={form.certificate} onChange={(value) => handleChange("certificate", value)} columns={1} />
            </Field>
          </FieldGrid>
        </FormSection>
      </FormPage>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  calendar: {
    marginTop: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.border,
    overflow: "hidden",
    maxWidth: 420,
    backgroundColor: "#ffffff",
  },
  progress: {
    padding: 20,
    gap: 12,
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundImage: gradients.hero,
    boxShadow: elevation.raised,
  },
  progressStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  progressHead: { alignItems: "center", justifyContent: "space-between" },
  progressTitle: { color: onDark.text, fontSize: 15 },
  progressPct: { color: palette.gold, fontSize: 18 },
  track: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundImage: gradients.gold,
    boxShadow: "0 0 12px rgba(255, 215, 0, 0.6)",
    transitionProperty: "width",
    transitionDuration: motion.slow,
  },
  fillRtl: { alignSelf: "flex-end" },
  progressText: { color: onDark.soft, fontSize: 12.5 },
});
