
import { GoogleGenAI, Type } from "@google/genai";
import { DocumentData, DocumentType } from "../types";
import { applyCompanyProfile, CompanyProfile } from "../companyProfiles";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDocumentData = async (
  type: DocumentType,
  company: CompanyProfile,
  prompt: string
): Promise<DocumentData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Act as a professional business analyst and designer specializing in the Malaysian market. 
      Generate a ${type} for the selected issuer company and the user context/requirements.

      Selected issuer company:
      - Company: ${company.orgName}
      - Display label: ${company.label}
      - Registration number: ${company.ssmNumber || 'Not provided'}
      - Tagline/ownership note: ${company.orgTagline || 'Not provided'}
      - Brand direction: ${company.promptHint}

      User context/requirements: ${prompt}.
      
      Tasks:
      1. Use the selected issuer company details exactly for the sender.
      2. For Malaysian documents, extract or intelligently infer from the user prompt where available: 
         - SST Number (if applicable)
         - Tax Identification Number (TIN) for LHDN e-Invoicing readiness
         - Banking details (Bank Name, Account Name, Account Number) for payment
      3. If specific pricing/items aren't in the prompt, intelligently infer appropriate services/products based on the issuer and prompt.
      4. Generate a structured JSON for a ${type}. 
         - Ensure currencyCode is extracted (e.g., "MYR").
         - Ensure currencySymbol is extracted (e.g., "RM").
         - Keep sender details aligned with the selected issuer company.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          docNumber: { type: Type.STRING },
          currencySymbol: { type: Type.STRING, description: "The currency symbol (e.g., RM)." },
          currencyCode: { type: Type.STRING, description: "The 3-letter currency code (e.g., MYR)." },
          date: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          purchaseOrder: { type: Type.STRING },
          clientName: { type: Type.STRING },
          clientEmail: { type: Type.STRING },
          clientAddress: { type: Type.STRING },
          clientTaxId: { type: Type.STRING },
          clientSsmNumber: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
              },
              required: ["description", "quantity", "unitPrice", "total"],
            },
          },
          subtotal: { type: Type.NUMBER },
          taxRate: { type: Type.NUMBER, description: "Tax rate percentage (e.g., 6)." },
          tax: { type: Type.NUMBER },
          shipping: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
          notes: { type: Type.STRING },
          theme: {
            type: Type.OBJECT,
            properties: {
              primaryColor: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              accentColor: { type: Type.STRING },
              fontFamily: { type: Type.STRING },
              logoPlaceholder: { type: Type.STRING },
              logoUrl: { type: Type.STRING, description: "Direct URL to the organization's logo image. Default to '/logo.png' if scanning morr.my context." },
              orgName: { type: Type.STRING },
              orgTagline: { type: Type.STRING },
              orgAddress: { type: Type.STRING },
              orgEmail: { type: Type.STRING },
              orgPhone: { type: Type.STRING },
              ssmNumber: { type: Type.STRING },
              sstNumber: { type: Type.STRING },
              taxId: { type: Type.STRING },
              bankName: { type: Type.STRING },
              bankAccountName: { type: Type.STRING },
              bankAccountNumber: { type: Type.STRING },
              bankBranch: { type: Type.STRING },
              swiftCode: { type: Type.STRING },
            },
            required: ["primaryColor", "secondaryColor", "orgName"],
          },
        },
        required: ["type", "docNumber", "items", "total", "theme", "currencyCode", "currencySymbol"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text);
    return {
      ...data,
      theme: applyCompanyProfile(data.theme, company),
    } as DocumentData;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to generate document data. Please try again.");
  }
};
