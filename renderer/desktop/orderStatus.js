/**
 * Order `status` codes as the desktop screens present them. The labels are
 * the same translation keys the mobile screens use (OrdersScreen, OrderItem),
 * so both apps describe an order the same way.
 *
 *   0 awaiting review · 1 in progress · 2 completed
 *   3 cancelled by you · 4 by the technician · 5 by Loop · 6 time expired
 */
export function orderStatusMeta(item, t) {
  const status = Number(item?.status);
  switch (status) {
    case 0:
      return { kind: 'warning', icon: 'hourglass-outline', label: t('Awaiting Review'), group: 'pending' };
    case 1: {
      let label = t('Active');
      if (item?.started_at) label = t('In Progress');
      else if (item?.arrived_at) label = t('Technician arrived at order location');
      else if (item?.set_off_at) label = t('Technician is on the way');
      return { kind: 'info', icon: 'construct-outline', label, group: 'active' };
    }
    case 2:
      return { kind: 'success', icon: 'checkmark-done-outline', label: t('Completed'), group: 'done' };
    case 3:
      return { kind: 'danger', icon: 'close-circle-outline', label: t('Canceled by You'), group: 'canceled' };
    case 4:
      return { kind: 'danger', icon: 'close-circle-outline', label: t('Canceled by Technician'), group: 'canceled' };
    case 5:
      return { kind: 'danger', icon: 'close-circle-outline', label: t('Canceled by Loop'), group: 'canceled' };
    case 6:
      return { kind: 'danger', icon: 'time-outline', label: t('Canceled due to Order Time Expiry'), group: 'canceled' };
    default:
      return { kind: 'neutral', icon: 'ellipse-outline', label: t('Canceled'), group: 'canceled' };
  }
}

/** Filter tabs of the orders page: [status value sent to the API, label key]. */
export const ORDER_STATUS_TABS = [
  { value: null, labelKey: 'All', icon: 'apps-outline' },
  { value: 0, labelKey: 'Awaiting Review', icon: 'hourglass-outline' },
  { value: 1, labelKey: 'In Progress', icon: 'construct-outline' },
  { value: 2, labelKey: 'Completed', icon: 'checkmark-done-outline' },
  { value: 3, labelKey: 'Canceled', icon: 'close-circle-outline' },
];
