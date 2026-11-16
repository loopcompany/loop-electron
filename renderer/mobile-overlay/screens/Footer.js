import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  Linking,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  colors,
  themeColor8,
  themeColor12,
  themeColor14,
} from "@theme/Color";
import { spacing } from "@theme/Spacing";
import { radius } from "@theme/Radius";
import { fontSize, getFontFamily } from "@theme/Typography";

// Compact glass button that lives inside the dock. Windows 7 Aero is only the
// visual mood here: a soft illumination on hover/press, and a brighter glass
// fill + blue glow + underline when the item is active.
function DockButton({ icon, label, active, onPress, lang }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.dockBtn,
        (hovered || pressed) && styles.dockBtnHover,
        active && styles.dockBtnActive,
      ]}
    >
      {active ? <View style={styles.activeGlow} pointerEvents="none" /> : null}
      <Ionicons
        name={icon}
        size={19}
        color={active ? themeColor14.color : colors.white.bgColor(0.82)}
      />
      {active ? (
        <Text
          style={[styles.dockBtnLabel, { fontFamily: getFontFamily("bold", lang) }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
      {active ? <View style={styles.activeUnderline} pointerEvents="none" /> : null}
    </Pressable>
  );
}

export default function Footer() {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const currentRoute = useNavigationState((state) => {
    try {
      return state?.routes?.[state.index]?.name || null;
    } catch {
      return null;
    }
  });

  const [menuItems] = useState([
    { id: 1, title: "سفارش‌های جاری / رزرو", screen: "DeviceOrderSummary" },
    { id: 2, title: "سازمانی / شرکتی", screen: "CorporateScreen" },
    { id: 3, title: "سفارش‌ها", screen: "OrdersScreen" },
    { id: 4, title: "تراکنش‌ها", screen: "TransactionsScreen" },
    { id: 5, title: "لغوشده ها", screen: "CanceledOrdersScreen" },
    { id: 6, title: "پیام", screen: "MessageScreen" },
    { id: 7, title: "حساب کاربری", screen: "Profile" },
    // { id: 8, title: "حریم خصوصی", screen: "PrivacyScreen" },
    { id: 9, title: "آدرس‌های منتخب", screen: "AddressScreen" },
    {
      id: 10,
      title: "ثبت‌نام دوره‌های آموزشی ",
      screen: "TrainingRegistrationScreen",
    },
    { id: 11, title: "فکروبکر", screen: "IdeaBoxScreen" },
    { id: 12, title: "طرح‌های تشویقی", screen: "Club" },
    { id: 13, title: "درخواست رسیدگی به سفارش‌های انجام‌شده", screen: "ProductIssueScreen" },
    { id: 14, title: "نرخنامه", screen: "RateListScreen" },
    { id: 15, title: "ثبت گزارش و بازخورد", screen: "ViolationReportScreen" },
    { id: 16, title: "نظرات و پیشنهادات", screen: "FeedbackSurveyScreen" },
    { id: 17, title: " ضمانت نامه / گارانتی", screen: "WarrantyScreen" },
    { id: 18, title: "یادداشت", screen: "NotesScreen" },
    { id: 19, title: " سوالات متداول", screen: "LearnMoreScreen" },
    { id: 20, title: "قوانین / درباره لوپ", screen: "AboutScreen" },
    { id: 21, title: "حریم خصوصی", screen: "PrivacyScreen" },
  ]);
  const [menuVisible, setMenuVisible] = useState(false);

  // ساعت سینی سیستم - الهام‌گرفته از ساعت گوشه‌ی تسک‌بار ویندوز ۷
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const timeLabel = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const navItems = [
    { key: "menu", icon: "grid-outline", label: "منو", action: "menu" },
    { key: "orders", icon: "receipt-outline", label: "سفارش‌ها", screen: "OrdersScreen" },
    { key: "call", icon: "call-outline", label: "تماس", action: "call" },
    { key: "support", icon: "headset-outline", label: "پشتیبانی", action: "support" },
    { key: "account", icon: "person-outline", label: "حساب", screen: "Profile" },
  ];

  const isActive = (item) => {
    if (item.action === "menu") return menuVisible;
    if (item.screen) return item.screen === currentRoute;
    return false;
  };

  const handlePress = (item) => {
    if (item.action === "menu") {
      setMenuVisible((v) => !v);
      return;
    }
    if (item.action === "call") {
      Linking.openURL("tel:02191693909");
      return;
    }
    if (item.action === "support") {
      navigation.navigate("MessageScreen");
      return;
    }
    if (item.screen) {
      navigation.navigate(item.screen);
      setMenuVisible(false);
    }
  };

  const renderItem = ({ item }) => (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.menuItem,
        (pressed || hovered) && styles.menuItemHover,
      ]}
      onPress={() => {
        navigation.navigate(item.screen);
        setMenuVisible(false);
      }}
    >
      <Text
        style={[styles.menuItemText, { fontFamily: getFontFamily("bold", lang) }]}
        numberOfLines={1}
      >
        {item.title}
      </Text>
      <Ionicons name="chevron-back" size={14} color={colors.white.bgColor(0.35)} />
    </Pressable>
  );

  return (
    <View>
      <Modal
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuPanel}>
                <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[themeColor12.bgColor(0.82), colors.black.bgColor(0.92)]}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={[colors.white.bgColor(0.12), colors.white.bgColor(0)]}
                  style={styles.topSheen}
                  pointerEvents="none"
                />
                <View style={styles.menuHandle} />
                <FlatList
                  data={menuItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* نوار پایین شناور با الهام از حس شیشه‌ای (Aero) ویندوز ۷ —
          نه بازسازی مو‌به‌مو: یک داک شیشه‌ای تیره با دکمه‌های آیکونی جمع‌وجور. */}
      <View style={styles.dockShadow}>
        <View style={styles.dock}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[themeColor12.bgColor(0.68), colors.black.bgColor(0.86)]}
            locations={[0, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* براقی داخلی بالا + خط نورانی لبه */}
          <LinearGradient
            colors={[colors.white.bgColor(0.16), colors.white.bgColor(0)]}
            style={styles.topSheen}
            pointerEvents="none"
          />
          <View style={styles.topEdge} pointerEvents="none" />
          {/* بازتاب و عمق در پایین */}
          <LinearGradient
            colors={[colors.black.bgColor(0), colors.black.bgColor(0.22)]}
            style={styles.bottomShade}
            pointerEvents="none"
          />

          <View style={styles.dockRow}>
            <View style={styles.navGroup}>
              {navItems.map((item) => (
                <DockButton
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  lang={lang}
                  active={isActive(item)}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>

            <View style={styles.trayDivider} />

            <View style={styles.tray}>
              <Ionicons
                name="globe-outline"
                size={13}
                color={colors.white.bgColor(0.7)}
              />
              <Text
                style={[styles.trayText, { fontFamily: getFontFamily("bold", lang) }]}
              >
                فا
              </Text>
              <Text
                style={[styles.trayClock, { fontFamily: getFontFamily("bold", lang) }]}
              >
                {timeLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer view carries the soft floating shadow; inner view clips the glass.
  dockShadow: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: themeColor12.bgColor(0.85),
    shadowColor: colors.black.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  dock: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.white.bgColor(0.16),
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 34,
  },
  topEdge: {
    position: "absolute",
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 1,
    backgroundColor: colors.white.bgColor(0.45),
  },
  bottomShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 22,
  },
  dockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 58,
  },
  navGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minWidth: 40,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.white.bgColor(0),
    overflow: "hidden",
  },
  dockBtnHover: {
    backgroundColor: colors.white.bgColor(0.09),
    borderColor: colors.white.bgColor(0.16),
  },
  dockBtnActive: {
    backgroundColor: themeColor8.bgColor(0.2),
    borderColor: themeColor8.bgColor(0.55),
    shadowColor: themeColor8.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  activeGlow: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: themeColor8.bgColor(0.28),
  },
  activeUnderline: {
    position: "absolute",
    bottom: 3,
    alignSelf: "center",
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: themeColor14.color,
  },
  dockBtnLabel: {
    color: themeColor14.color,
    fontSize: fontSize.xs,
  },
  trayDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.white.bgColor(0.16),
    marginHorizontal: spacing.sm,
  },
  tray: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  trayText: {
    color: colors.white.bgColor(0.75),
    fontSize: fontSize.xs,
  },
  trayClock: {
    color: colors.white.bgColor(1),
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },

  // Bottom-sheet style menu, same dark glass language as the dock.
  menuOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.black.bgColor(0.45),
  },
  menuPanel: {
    maxHeight: "72%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.white.bgColor(0.14),
    paddingBottom: spacing.lg,
  },
  menuHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white.bgColor(0.25),
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  list: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.white.bgColor(0.06),
  },
  menuItemHover: {
    backgroundColor: colors.white.bgColor(0.08),
  },
  menuItemText: {
    flex: 1,
    color: colors.white.bgColor(0.9),
    fontSize: fontSize.sm,
    textAlign: "right",
  },
});
