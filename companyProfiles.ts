import { BrandingTheme, CompanyId } from './types';

export interface CompanyProfile extends BrandingTheme {
  id: CompanyId;
  label: string;
  promptHint: string;
}

export const COMPANY_PROFILES: CompanyProfile[] = [
  {
    id: 'morr',
    companyId: 'morr',
    label: 'MORR',
    promptHint: 'Use the existing MORR Technologies minimalist brand style.',
    primaryColor: '#4f46e5',
    secondaryColor: '#111827',
    accentColor: '#6366f1',
    fontFamily: "'Inter', sans-serif",
    logoPlaceholder: 'MORR',
    logoUrl: '/logo.png',
    orgName: 'Morr Technologies',
    orgTagline: 'Professional technology solutions',
    orgAddress: '40-1, Jalan Medang Serai, Bukit Bandaraya, Bangsar, Kuala Lumpur, 59100',
    orgEmail: '',
    orgPhone: '',
    bankName: 'United Overseas Bank (Malaysia) Berhad',
    bankAccountName: 'Morr Technologies',
    bankAccountNumber: '220-302-7089',
    bankBranch: 'Bangsar branch, Kuala Lumpur Malaysia',
  },
  {
    id: 'tumeng-bi',
    companyId: 'tumeng-bi',
    label: 'TUMENG BI',
    promptHint: 'Use a technology-forward, teal corporate style for TUMENG BI.',
    primaryColor: '#23b69b',
    secondaryColor: '#0f766e',
    accentColor: '#ecfeff',
    fontFamily: "'Inter', sans-serif",
    logoPlaceholder: 'TUMENG BI',
    logoUrl: '/tumeng-bi-logo.jpeg',
    orgName: 'TU MENG BI TECHNOLOGY SDN BHD',
    orgTagline: 'Business intelligence and technology services',
    orgAddress: '40-1, Jalan Medang Serai, Bukit Bandaraya, Bangsar, Kuala Lumpur, 59100',
    orgEmail: '',
    orgPhone: '',
    ssmNumber: '1328606-D / 201901019277',
    bankName: 'United Overseas Bank (Malaysia) Berhad',
    bankAccountName: 'TU MENG BI TECHNOLOGY SDN BHD',
    bankAccountNumber: '220-301-826-8',
    bankBranch: 'Bangsar branch, Kuala Lumpur Malaysia',
    swiftCode: 'UOVBMYKL',
  },
  {
    id: 'house-of-healing',
    companyId: 'house-of-healing',
    label: 'The House of Healing',
    promptHint: 'Use a calm wellness-led layout with refined editorial spacing.',
    primaryColor: '#365f52',
    secondaryColor: '#c08f57',
    accentColor: '#f6efe6',
    fontFamily: "'Inter', sans-serif",
    logoPlaceholder: 'THE HOUSE OF HEALING',
    logoUrl: '/house-of-healing-logo.jpeg',
    orgName: 'THE HOUSE OF HEALING',
    orgTagline: 'Own by CHUN FORTUNE GLOBAL SDN BHD',
    orgAddress: '1, Jalan 7/16, Seksyen, 46050 Petaling Jaya, Selangor',
    orgEmail: '',
    orgPhone: '',
    ssmNumber: '1295493-D / 201801033466',
    bankName: 'RHB Bank Berhad',
    bankAccountName: 'CHUN FORTUNE GLOBAL SDN BHD',
    bankAccountNumber: '2142-77000-86154',
    bankBranch: 'Bangsar Shopping Center, Kuala Lumpur Malaysia',
    swiftCode: 'RHBBMYKL',
  },
];

export const getCompanyProfile = (id: CompanyId) =>
  COMPANY_PROFILES.find((company) => company.id === id) || COMPANY_PROFILES[0];

export const applyCompanyProfile = (
  theme: BrandingTheme | undefined,
  company: CompanyProfile
): BrandingTheme => ({
  ...theme,
  ...company,
  companyId: company.id,
  logoUrl: company.logoUrl,
  logoPlaceholder: company.logoPlaceholder,
  orgName: company.orgName,
  orgTagline: company.orgTagline,
  orgAddress: company.orgAddress,
  orgEmail: company.orgEmail,
  orgPhone: company.orgPhone,
  ssmNumber: company.ssmNumber,
  bankName: company.bankName,
  bankAccountName: company.bankAccountName,
  bankAccountNumber: company.bankAccountNumber,
  bankBranch: company.bankBranch,
  swiftCode: company.swiftCode,
});
