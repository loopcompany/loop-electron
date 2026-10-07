/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/ConfirmationModal.js
 *
 * Same props and the same behaviour (Yes runs `action` then closes, No
 * closes), drawn as a centred desktop dialog (@desktop/Dialog) instead of a
 * phone sheet.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { useTranslation } from 'react-i18next';

import Dialog from '@desktop/Dialog';
import { DButton } from '@desktop/ui';

export default function ConfirmationModal({ title, message, action, confirmationModal, setConfirmationModal }) {
    const { t } = useTranslation();
    const close = () => setConfirmationModal(false);

    return (
        <Dialog
            visible={!!confirmationModal}
            onClose={close}
            title={title}
            message={message}
            icon="help-circle-outline"
            kind="warning"
            actions={
                <>
                    <DButton title={t('Yes')} icon="checkmark" onPress={() => { action(); close(); }} />
                    <DButton title={t('No')} variant="outline" onPress={close} />
                </>
            }
        />
    );
}
