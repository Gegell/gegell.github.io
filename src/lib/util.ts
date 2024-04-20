type DateStyle = Intl.DateTimeFormatOptions['dateStyle'];

export function dateFormat(date: string, dateStyle: DateStyle= 'long', locales=[]) {
    const dateToFormat = new Date(date.replaceAll('-', '/'));  // Safari doesn't like dashes in dates
    const dateFormatter = new Intl.DateTimeFormat(locales, { dateStyle });
    return dateFormatter.format(dateToFormat);
}