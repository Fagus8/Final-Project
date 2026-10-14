// სისხლის ჯგუფები. პაციენტმა შეიძლება ჯერ არ იცოდეს — მაშინ ბაზაში null ინახება
export const BLOOD_TYPES = [
  "O(I)+",
  "O(I)-",
  "A(II)+",
  "A(II)-",
  "B(III)+",
  "B(III)-",
  "AB(IV)+",
  "AB(IV)-",
] as const;
