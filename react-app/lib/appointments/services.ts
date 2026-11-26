import { site } from '@/data/site';

export function serviceSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const generalCheckupService = {
  id: 'general-checkup',
  label: 'كشف عام',
  labelEn: 'General check-up',
};

export const appointmentServices = site.services.map((service) => ({
  id: serviceSlug(service.title),
  label: service.titleAr,
  labelEn: service.title,
}));

export const serviceById = new Map(
  appointmentServices.map((service) => [service.id, service])
);
