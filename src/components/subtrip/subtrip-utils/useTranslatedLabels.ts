import { useTranslation } from 'react-i18next';
import {
  activities,
  tripInterests,
  tinderOptions,
  roadTripInterests
} from './constants';

export const useTranslatedLabels = () => {
  const { t } = useTranslation('home');

  const translatedActivities = activities.map(activity => ({
    ...activity,
    label: t(`activities.${activity.id}`)
  }));

  const translatedTripInterests = tripInterests.map(category => ({
    category: t(`tripInterests.${category.items[0].id.split('-')[0]}`),
    items: category.items.map(item => ({
      ...item,
      label: t(`tripInterests.${item.id}`)
    }))
  }));

  const translatedTinderOptions = tinderOptions.map(option => ({
    ...option,
    label: t(`tinderOptions.${option.id}`)
  }));

  const translatedRoadTripInterests = roadTripInterests.map(interest => ({
    ...interest,
    label: t(`tinderOptions.${interest.id}`)
  }));

  return {
    activities: translatedActivities,
    tripInterests: translatedTripInterests,
    tinderOptions: translatedTinderOptions,
    roadTripInterests: translatedRoadTripInterests
  };
}; 