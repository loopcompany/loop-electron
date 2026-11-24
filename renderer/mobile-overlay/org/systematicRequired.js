// منطقِ خالصِ «کدام مراحل الزامی ناقص‌اند» در سفارش سیستماتیک. جدا از صفحه است تا
// بدون رندر قابل آزمودن باشد (org/__tests__/systematicFlows.test.js).
//
// قاعده از سند کارفرما (۲۵ آبان ۱۴۰۵، بند ۳۵): مراحل الزامیِ هر دستگاه باید پر شوند و
// از گروه خدمات (سیستم عامل / نصب نرم افزار / عیوب نرم افزار / عیوب سخت افزار) حداقل
// یکی انتخاب شود.
import { SERVICE_STEP_IDS } from './systematicFlows';

/**
 * آیا گروه خدمات هنوز انتخاب نشده است؟ (دستگاهی که مرحله‌ی خدمات ندارد همیشه «انتخاب شده» است.)
 * @param {Array<{id: string}>} steps
 * @param {Record<string, any>} answers
 * @param {(step: object, value: any) => boolean} isStepFilled
 */
export const isServiceGroupMissing = (steps, answers, isStepFilled) => {
  const serviceSteps = steps.filter((step) => SERVICE_STEP_IDS.includes(step.id));
  return serviceSteps.length > 0 && !serviceSteps.some((step) => isStepFilled(step, answers[step.id]));
};

/**
 * مراحل الزامیِ ناقص، به ترتیب خودِ مراحل.
 *
 * گروه خدمات در جای اولین عضو خودش ایستاده است: تا وقتی هیچ‌کدام از مراحل خدمات
 * انتخاب نشده، همان عضو اول در خروجی می‌آید و بعد از آن بقیه‌ی مراحل خدمات نادیده
 * گرفته می‌شوند (تا یک «نقص» بیش از یک بار گزارش نشود).
 *
 * @returns {Array<object>} مراحل ناقص؛ خالی یعنی سفارش از نظر الزامی‌ها کامل است
 */
export const listMissingSteps = (steps, answers, isStepFilled) => {
  const missing = [];
  const serviceMissing = isServiceGroupMissing(steps, answers, isStepFilled);
  let serviceReported = false;
  steps.forEach((step) => {
    if (SERVICE_STEP_IDS.includes(step.id)) {
      if (serviceReported) return;
      if (serviceMissing) {
        serviceReported = true;
        missing.push(step);
      }
      return;
    }
    if (step.required && !isStepFilled(step, answers[step.id])) missing.push(step);
  });
  return missing;
};

/**
 * آیا می‌شود از مرحله‌ی `fromId` به مرحله‌ی `toId` رفت؟
 *
 * برگشتن به عقب (یا لمس همان مرحله) همیشه آزاد است. جلو رفتن مجاز نیست وقتی:
 *  - مرحله‌ی فعلی الزامی است و هنوز پر نشده (`reason: 'required'`)، یا
 *  - آخرین عضو گروه خدمات است و هنوز هیچ‌کدام از مراحل خدمات انتخاب نشده (`reason: 'service'`).
 *    حرکت میان خودِ مراحل خدمات آزاد است.
 *
 * این همان قاعده‌ی سند کارفرماست (۲۵ آبان ۱۴۰۵، بند ۳۵): هر مرحله باید «حتماً تکمیل شود»
 * تا دکمه‌ی نمایش / استعلام / ثبت سفارش فعال شود. بدون آن، کاربر تا آخر می‌رفت و آنجا
 * دکمه‌ی فعال‌ای نداشت.
 *
 * @returns {null | { step: object, reason: 'required' | 'service' }}
 */
export const leaveBlockReason = (steps, answers, isStepFilled, fromId, toId) => {
  const fromIndex = steps.findIndex((step) => step.id === fromId);
  const toIndex = steps.findIndex((step) => step.id === toId);
  if (fromIndex < 0 || toIndex <= fromIndex) return null;
  const from = steps[fromIndex];
  if (SERVICE_STEP_IDS.includes(from.id)) {
    const isLastServiceStep = !steps.slice(fromIndex + 1).some((step) => SERVICE_STEP_IDS.includes(step.id));
    if (isLastServiceStep && isServiceGroupMissing(steps, answers, isStepFilled)) {
      return { step: from, reason: 'service' };
    }
    return null;
  }
  if (from.required && !isStepFilled(from, answers[from.id])) return { step: from, reason: 'required' };
  return null;
};

/** پیام مناسب برای دلیل بسته‌شدن مسیر. `L` همان تابع ترجمه‌ی org است. */
export const leaveBlockMessage = (block, L) =>
  block.reason === 'service'
    ? L('یکی از این مراحل الزامی است')
    : `${L(block.step.title)} — ${L('لطفاً این مرحله را تکمیل کنید')}`;
