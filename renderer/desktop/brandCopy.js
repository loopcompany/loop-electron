/**
 * The brand lines the desktop app repeats in several places (welcome screen,
 * sidebar, entry screens, home banner), so they are written once:
 * the tagline, the welcome line and the greeting for the time of day.
 */
import { useEffect, useState } from 'react';

const COPY = {
  fa: {
    tagline: 'خدمات و راهکارهای فناوری، در یک فضای یکپارچه',
    welcome: 'به جوهر آینده (لوپ) خوش آمدید',
    morning: 'صبح بخیر',
    day: 'روز بخیر',
    night: 'شب بخیر',
  },
  en: {
    tagline: 'Technology services and solutions, in one unified space',
    welcome: 'Welcome to the essence of the future (Loop)',
    morning: 'Good morning',
    day: 'Good afternoon',
    night: 'Good evening',
  },
};

export const brandCopy = (lang) => COPY[lang === 'fa' ? 'fa' : 'en'];

// صبح ۴ تا ۱۲، روز ۱۲ تا ۱۸، شب ۱۸ تا ۴ — by the computer's clock (which
// Windows keeps in sync with internet time)
const MORNING = 4;
const DAY = 12;
const NIGHT = 18;

const periodOf = (date) => {
  const h = date.getHours();
  if (h >= MORNING && h < DAY) return 'morning';
  if (h >= DAY && h < NIGHT) return 'day';
  return 'night';
};

/** ms until the greeting next changes */
const msToNextPeriod = (now) => {
  const next = new Date(now);
  const h = now.getHours();
  const boundary = h < MORNING ? MORNING : h < DAY ? DAY : h < NIGHT ? NIGHT : MORNING + 24;
  next.setHours(boundary, 0, 5, 0);
  return next - now;
};

export const timeGreeting = (lang, date = new Date()) => brandCopy(lang)[periodOf(date)];

/** Ionicons name for the greeting: sun by day, moon at night. */
export const greetingIcon = (date = new Date()) => (periodOf(date) === 'night' ? 'moon' : 'sunny');

/**
 * «صبح بخیر» / «روز بخیر» / «شب بخیر» for now; switches by itself when the
 * app stays open across 12:00, 18:00 or 04:00 (one timer, no polling).
 */
export function useTimeGreeting(lang) {
  const [period, setPeriod] = useState(() => periodOf(new Date()));
  useEffect(() => {
    const timer = setTimeout(() => setPeriod(periodOf(new Date())), msToNextPeriod(new Date()));
    return () => clearTimeout(timer);
  }, [period]);
  return brandCopy(lang)[period];
}
