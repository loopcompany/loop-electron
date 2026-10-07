/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/Loader.js
 *
 * The full-area loading state, as the desktop spinner (@desktop/ui Spinner)
 * on a transparent background so it sits naturally in the page card or on
 * the canvas.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { StyleSheet, View } from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Spinner } from '@desktop/ui';

export default function Loader() {
    const { i18n } = useTranslation();
    return (
        <View style={styles.loaderWrapper}>
            <Spinner label={i18n.language === 'fa' ? 'در حال بارگذاری…' : 'Loading…'} />
        </View>
    )
}

const styles = StyleSheet.create({
    loaderWrapper: {
        flex: 1,
        height: '100%',
        width: '100%',
        minHeight: 240,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
