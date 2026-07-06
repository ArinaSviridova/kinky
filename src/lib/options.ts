import { t } from './i18n';

export type SelectOption = {
  value: string;
  labelKey: Parameters<typeof t>[0];
};

export const interestedInOptions: SelectOption[] = [
  { value: 'men', labelKey: 'optMen' },
  { value: 'women', labelKey: 'optWomen' },
  { value: 'trans', labelKey: 'optTrans' },
  { value: 'any', labelKey: 'optAny' },
];

export const lookingForOptions: SelectOption[] = [
  { value: 'friendly', labelKey: 'optFriendly' },
  { value: 'flirt', labelKey: 'optFlirt' },
  { value: 'company', labelKey: 'optCompany' },
  { value: 'meet_before', labelKey: 'optMeetBefore' },
  { value: 'networking', labelKey: 'optNetworking' },
  { value: 'dance', labelKey: 'optDance' },
  { value: 'just_looking', labelKey: 'optJustLooking' },
];

export const approachOptions: SelectOption[] = [
  { value: 'message_before', labelKey: 'optMessageBefore' },
  { value: 'match_first', labelKey: 'optMatchFirst' },
  { value: 'approach_after_match', labelKey: 'optApproachAfterMatch' },
  { value: 'shy_open', labelKey: 'optShyOpen' },
  { value: 'no_hard_flirt', labelKey: 'optNoHardFlirt' },
  { value: 'directness', labelKey: 'optDirectness' },
];

export const boundaryOptions: SelectOption[] = [
  { value: 'no_touch_without_consent', labelKey: 'optNoTouch' },
  { value: 'no_photo', labelKey: 'optNoPhoto' },
  { value: 'no_sexual_messages', labelKey: 'optNoSexualMessages' },
  { value: 'no_pressure', labelKey: 'optNoPressure' },
  { value: 'talk_first', labelKey: 'optTalkFirst' },
  { value: 'light_flirt_only', labelKey: 'optLightFlirt' },
];

export const goingAsOptions: SelectOption[] = [
  { value: 'alone', labelKey: 'optAlone' },
  { value: 'partner', labelKey: 'optPartner' },
  { value: 'friends', labelKey: 'optFriends' },
  { value: 'couple', labelKey: 'optCouple' },
];

const allOptions = [
  ...interestedInOptions,
  ...lookingForOptions,
  ...approachOptions,
  ...boundaryOptions,
  ...goingAsOptions,
];

export function labelForValue(value: string) {
  const found = allOptions.find((option) => option.value === value);
  return found ? t(found.labelKey) : value;
}

export function labelsForValues(values: string[] | null | undefined) {
  return (values || []).map(labelForValue);
}
