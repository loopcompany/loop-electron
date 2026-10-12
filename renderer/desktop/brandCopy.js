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
    noon: 'ظهر بخیر',
    evening: 'عصر بخیر',
    night: 'شب بخیر',
  },
  en: {
    tagline: 'Technology services and solutions, in one unified space',
    welcome: 'Welcome to the essence of the future (Loop)',
    morning: 'Good morning',
    noon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  },
};

export const brandCopy = (lang) => COPY[lang === 'fa' ? 'fa' : 'en'];

// صبح ۵:۰۰ تا ۱۱:۵۹، ظهر ۱۲:۰۰ تا ۱۴:۵۹، عصر ۱۵:۰۰ تا ۱۸:۵۹، شب ۱۹:۰۰ تا ۴:۵۹
// Read on Iran's clock, not the computer's time zone: Windows keeps UTC in
// sync with internet time, but a PC left on the default (US) zone showed
// «شب بخیر» at 13:52 Tehran time.
const PERIODS = [
  [5, 'morning'],
  [12, 'noon'],
  [15, 'evening'],
  [19, 'night'],
];
const BOUNDARIES = PERIODS.map(([h]) => h);

/** [hour, minute] on Iran's clock; the computer's own clock if Intl can't. */
let tehranTime;
try {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  tehranTime = (date) => {
    const parts = fmt.formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    return [get('hour') % 24, get('minute')];
  };
} catch {
  tehranTime = (date) => [date.getHours(), date.getMinutes()];
}

const periodOf = (date) => {
  const [h] = tehranTime(date);
  let period = 'night';
  for (const [from, name] of PERIODS) if (h >= from) period = name;
  return period;
};

/** ms until the greeting next changes (to the next whole hour that is a boundary) */
const msToNextPeriod = (now) => {
  const [h, m] = tehranTime(now);
  const next = BOUNDARIES.find((b) => b > h) ?? BOUNDARIES[0] + 24;
  const msIntoHour = (m * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
  return (next - h) * 3600000 - msIntoHour + 5000;
};

export const timeGreeting = (lang, date = new Date()) => brandCopy(lang)[periodOf(date)];

/** Ionicons name for the greeting: sun by day, sun-and-cloud in the evening, moon at night. */
export const greetingIcon = (date = new Date()) =>
  ({ morning: 'sunny', noon: 'sunny', evening: 'partly-sunny', night: 'moon' })[periodOf(date)];

/**
 * «صبح بخیر» / «ظهر بخیر» / «عصر بخیر» / «شب بخیر» for now; switches by itself
 * when the app stays open across 05:00, 12:00, 15:00 or 19:00 (one timer, no polling).
 */
export function useTimeGreeting(lang) {
  const [period, setPeriod] = useState(() => periodOf(new Date()));
  useEffect(() => {
    const timer = setTimeout(() => setPeriod(periodOf(new Date())), msToNextPeriod(new Date()));
    return () => clearTimeout(timer);
  }, [period]);
  return brandCopy(lang)[period];
}
