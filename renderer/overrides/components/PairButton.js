/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/PairButton.js
 *
 * The primary + secondary (usually destructive) button pair. Same props;
 * drawn with the desktop buttons (@desktop/ui DButton).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { View, StyleSheet } from 'react-native';

import NewStyles from '@styles/NewStyles';
import { DButton } from '@desktop/ui';

export default function PairButton({ text1, text2, onPress1, onPress2, loading1, loading2, style }) {
    return (
        <View style={[NewStyles.row, styles.row]}>
            {!!text1 && <DButton title={text1} onPress={onPress1} loading={loading1} disabled={loading1} textStyle={style} />}
            {!!text2 && <DButton title={text2} onPress={onPress2} loading={loading2} disabled={loading2} variant="danger" />}
        </View>
    )
}

const styles = StyleSheet.create({
    row: { gap: 8 },
})
