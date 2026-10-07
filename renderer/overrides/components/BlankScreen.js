/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/BlankScreen.js
 *
 * The "nothing here yet" state of list screens, drawn as the desktop empty
 * state (@desktop/ui EmptyState). Same props as the mobile file (title /
 * icon / message / buttonText / onButtonPress; messages are translation
 * keys). Most screens render it with no props at all, which on the phone
 * gives every empty page the same "no content" line; here the page it sits
 * on picks a fitting icon, title and hint (EMPTY_BY_ROUTE) unless the caller
 * passed its own.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { StyleSheet, View } from 'react-native'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { NavigationRouteContext, useNavigation } from '@react-navigation/native'

import { DButton, EmptyState } from '@desktop/ui'

const DEFAULT_ICON = 'document-outline';
const DEFAULT_MESSAGE = 'No content to display yet';

// Desktop-only copy; kept here rather than in the shared i18n files.
const EMPTY_BY_ROUTE = {
    OrdersScreen: {
        icon: 'receipt-outline',
        fa: ['هنوز سفارشی ثبت نکرده‌اید', 'از داشبورد یک دستگاه را انتخاب کنید تا اولین سفارش‌تان را ثبت کنید.'],
        en: ['No orders yet', 'Pick a device on the dashboard to place your first order.'],
    },
    UserDiscounts: {
        icon: 'pricetags-outline',
        fa: ['هنوز کد تشویقی ندارید', 'کدهای تخفیف و جوایزی که دریافت می‌کنید اینجا نمایش داده می‌شوند.'],
        en: ['No promotional codes yet', 'Discount codes and rewards you receive will show up here.'],
    },
    LearnMoreScreen: {
        icon: 'help-buoy-outline',
        fa: ['پرسشی برای نمایش وجود ندارد', 'پرسش‌های متداول به‌زودی اینجا قرار می‌گیرند. سؤالتان را می‌توانید از پشتیبانی بپرسید.'],
        en: ['No questions to show', 'Frequently asked questions will appear here soon. You can ask support in the meantime.'],
        support: true,
    },
    FAQScreen: {
        icon: 'help-buoy-outline',
        fa: ['پرسشی برای نمایش وجود ندارد', 'پرسش‌های متداول به‌زودی اینجا قرار می‌گیرند. سؤالتان را می‌توانید از پشتیبانی بپرسید.'],
        en: ['No questions to show', 'Frequently asked questions will appear here soon. You can ask support in the meantime.'],
        support: true,
    },
    AboutScreen: {
        icon: 'information-circle-outline',
        fa: ['متنی برای نمایش وجود ندارد', 'شرایط استفاده و معرفی لوپ به‌زودی در این بخش منتشر می‌شود.'],
        en: ['Nothing to show yet', 'Loop’s terms and introduction will be published here soon.'],
    },
    OrganizationTermsScreen: {
        icon: 'document-text-outline',
        fa: ['قوانین سازمانی هنوز منتشر نشده است', 'شرایط و ضوابط پنل سازمانی به‌زودی در این بخش قرار می‌گیرد.'],
        en: ['Organisation terms aren’t published yet', 'The terms of the organisation panel will appear here soon.'],
    },
};

const BlankScreen = ({
    // eslint-disable-next-line no-unused-vars
    title = "Empty Page",
    icon = DEFAULT_ICON,
    message = DEFAULT_MESSAGE,
    buttonText = "Back",
    onButtonPress,
}) => {
    const { t, i18n } = useTranslation();
    const route = useContext(NavigationRouteContext);
    const navigation = useNavigation();
    const preset = EMPTY_BY_ROUTE[route?.name];
    const lang = i18n.language === 'fa' ? 'fa' : 'en';

    // the caller's own icon / message win over the page preset
    const useIcon = icon !== DEFAULT_ICON ? icon : preset?.icon || icon;
    const [presetTitle, presetMessage] = preset?.[lang] || [];
    const heading = message !== DEFAULT_MESSAGE ? t(message) : presetTitle || t(message);
    const hint = message !== DEFAULT_MESSAGE ? undefined : presetMessage;

    let action = null;
    if (onButtonPress) {
        action = <DButton title={t(buttonText)} variant="primary" onPress={onButtonPress} />;
    } else if (preset?.support) {
        action = (
            <DButton
                title={lang === 'fa' ? 'پیام به پشتیبانی' : 'Message support'}
                icon="chatbubbles-outline"
                variant="outline"
                onPress={() => navigation.navigate('MessageScreen')}
            />
        );
    }

    return (
        <View style={styles.container}>
            <EmptyState icon={useIcon} title={heading} message={hint} action={action} />
        </View>
    )
}

export default BlankScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        minHeight: 360,
    },
})
