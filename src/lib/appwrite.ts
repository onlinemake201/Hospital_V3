import { Client, Account, Databases, Storage, Query, ID } from 'appwrite';

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68f4f8c8002cda88c2ef';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'hospital_main';

// Collection IDs
export const COLLECTIONS = {
  USERS: process.env.APPWRITE_COLLECTION_USERS || 'users',
  ROLES: process.env.APPWRITE_COLLECTION_ROLES || 'roles',
  PATIENTS: process.env.APPWRITE_COLLECTION_PATIENTS || 'patients',
  APPOINTMENTS: process.env.APPWRITE_COLLECTION_APPOINTMENTS || 'appointments',
  MEDICATIONS: process.env.APPWRITE_COLLECTION_MEDICATIONS || 'medications',
  PRESCRIPTIONS: process.env.APPWRITE_COLLECTION_PRESCRIPTIONS || 'prescriptions',
  PRESCRIPTION_ITEMS: process.env.APPWRITE_COLLECTION_PRESCRIPTION_ITEMS || 'prescription_items',
  ADMINISTRATIONS: process.env.APPWRITE_COLLECTION_ADMINISTRATIONS || 'administrations',
  INVOICES: process.env.APPWRITE_COLLECTION_INVOICES || 'invoices',
  INVOICE_ITEMS: process.env.APPWRITE_COLLECTION_INVOICE_ITEMS || 'invoice_items',
  PAYMENTS: process.env.APPWRITE_COLLECTION_PAYMENTS || 'payments',
  SUPPLIERS: process.env.APPWRITE_COLLECTION_SUPPLIERS || 'suppliers',
  AUDIT_LOGS: process.env.APPWRITE_COLLECTION_AUDIT_LOGS || 'audit_logs',
  CUSTOM_FIELDS: process.env.APPWRITE_COLLECTION_CUSTOM_FIELDS || 'custom_fields',
  SYSTEM_SETTINGS: process.env.APPWRITE_COLLECTION_SYSTEM_SETTINGS || 'system_settings',
  COMPANY_INFO: process.env.APPWRITE_COLLECTION_COMPANY_INFO || 'company_info',
  ENCOUNTERS: process.env.APPWRITE_COLLECTION_ENCOUNTERS || 'encounters',
  STOCK_MOVEMENTS: process.env.APPWRITE_COLLECTION_STOCK_MOVEMENTS || 'stock_movements',
  MEDICATION_IMAGES: process.env.APPWRITE_BUCKET_MEDICATION_IMAGES || 'medication_images',
};

// Initialize Appwrite client for authentication
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Server-side operations using REST API directly
export const serverDatabases = {
  async listDocuments(databaseId: string, collectionId: string, queries: string[] = []) {
    const queryString = queries.length > 0 ? `?queries[]=${queries.join('&queries[]=')}` : '';
    const url = `${APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${collectionId}/documents${queryString}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
  
  async getDocument(databaseId: string, collectionId: string, documentId: string) {
    const url = `${APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
  
  async createDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
    const url = `${APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${collectionId}/documents`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        data,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
  
  async updateDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
    const url = `${APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
  
  async deleteDocument(databaseId: string, collectionId: string, documentId: string) {
    const url = `${APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};

// Export client and ID helper for custom configurations/usage
export { client, ID };

// Database ID
export const DATABASE_ID = APPWRITE_DATABASE_ID;

// Helper functions
export const createDocument = async (collectionId: string, data: any, documentId?: string) => {
  return await databases.createDocument(
    DATABASE_ID,
    collectionId,
    documentId || ID.unique(),
    data
  );
};

export const getDocument = async (collectionId: string, documentId: string) => {
  return await databases.getDocument(DATABASE_ID, collectionId, documentId);
};

export const updateDocument = async (collectionId: string, documentId: string, data: any) => {
  return await databases.updateDocument(DATABASE_ID, collectionId, documentId, data);
};

export const deleteDocument = async (collectionId: string, documentId: string) => {
  return await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
};

export const listDocuments = async (
  collectionId: string,
  queries: string[] = []
) => {
  return await databases.listDocuments(DATABASE_ID, collectionId, queries);
};

// Auth helpers
export const authHelpers = {
  getCurrentUser: async () => {
    console.log('👤 authHelpers.getCurrentUser() called')
    try {
      const user = await account.get();
      console.log('✅ getCurrentUser success:', {
        userId: user.$id,
        email: user.email,
        name: user.name,
        registration: user.registration,
        emailVerification: user.emailVerification,
        phoneVerification: user.phoneVerification
      });
      return user;
    } catch (error) {
      console.log('❌ getCurrentUser failed:', error);
      return null;
    }
  },
  
  login: async (email: string, password: string) => {
    console.log('🔐 authHelpers.login() called with:', { email, passwordLength: password.length });
    console.log('📡 Appwrite Client Config:', {
      endpoint: APPWRITE_ENDPOINT,
      projectId: APPWRITE_PROJECT_ID
    });
    
    try {
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Login successful - Session created:', {
        sessionId: session.$id,
        userId: session.userId,
        current: session.current,
        ip: session.ip,
        osCode: session.osCode,
        osName: session.osName,
        clientType: session.clientType,
        clientCode: session.clientCode,
        countryCode: session.countryCode,
        countryName: session.countryName
      });
      return session;
    } catch (error) {
      console.log('❌ Login failed:', error);
      throw error;
    }
  },
  
  logout: async () => {
    console.log('🚪 authHelpers.logout() called');
    try {
      const result = await account.deleteSession('current');
      console.log('✅ Logout successful:', result);
      return result;
    } catch (error) {
      console.log('❌ Logout failed:', error);
      throw error;
    }
  },
  
  register: async (email: string, password: string, name: string) => {
    console.log('📝 authHelpers.register() called with:', { email, name, passwordLength: password.length });
    try {
      const user = await account.create(ID.unique(), email, password, name);
      console.log('✅ Registration successful:', {
        userId: user.$id,
        email: user.email,
        name: user.name,
        registration: user.registration
      });
      return user;
    } catch (error) {
      console.log('❌ Registration failed:', error);
      throw error;
    }
  },
  
  updatePassword: async (password: string, oldPassword: string) => {
    console.log('🔑 authHelpers.updatePassword() called');
    try {
      const result = await account.updatePassword(password, oldPassword);
      console.log('✅ Password update successful:', result);
      return result;
    } catch (error) {
      console.log('❌ Password update failed:', error);
      throw error;
    }
  },
  
  updateEmail: async (email: string, password: string) => {
    console.log('📧 authHelpers.updateEmail() called with:', email);
    try {
      const result = await account.updateEmail(email, password);
      console.log('✅ Email update successful:', result);
      return result;
    } catch (error) {
      console.log('❌ Email update failed:', error);
      throw error;
    }
  },
  
  updateName: async (name: string) => {
    console.log('👤 authHelpers.updateName() called with:', name);
    try {
      const result = await account.updateName(name);
      console.log('✅ Name update successful:', result);
      return result;
    } catch (error) {
      console.log('❌ Name update failed:', error);
      throw error;
    }
  },
};

// Query helpers
export const QueryHelpers = {
  equal: (attribute: string, value: string | number | boolean) => Query.equal(attribute, value),
  notEqual: (attribute: string, value: string | number | boolean) => Query.notEqual(attribute, value),
  lessThan: (attribute: string, value: string | number) => Query.lessThan(attribute, value),
  lessThanEqual: (attribute: string, value: string | number) => Query.lessThanEqual(attribute, value),
  greaterThan: (attribute: string, value: string | number) => Query.greaterThan(attribute, value),
  greaterThanEqual: (attribute: string, value: string | number) => Query.greaterThanEqual(attribute, value),
  contains: (attribute: string, value: string) => Query.contains(attribute, value),
  search: (attribute: string, value: string) => Query.search(attribute, value),
  orderDesc: (attribute: string) => Query.orderDesc(attribute),
  orderAsc: (attribute: string) => Query.orderAsc(attribute),
  limit: (limit: number) => Query.limit(limit),
  offset: (offset: number) => Query.offset(offset),
  cursorAfter: (cursor: string) => Query.cursorAfter(cursor),
  cursorBefore: (cursor: string) => Query.cursorBefore(cursor),
};

// Permission helpers
export const permissionHelpers = {
  read: (role: string) => `read("${role}")`,
  create: (role: string) => `create("${role}")`,
  update: (role: string) => `update("${role}")`,
  delete: (role: string) => `delete("${role}")`,
  readAny: () => 'read("any")',
  createAny: () => 'create("any")',
  updateAny: () => 'update("any")',
  deleteAny: () => 'delete("any")',
};

// Error handling
export const handleAppwriteError = (error: any) => {
  console.error('Appwrite Error:', error);
  
  if (error.code === 401) {
    return { error: 'Unauthorized', message: 'Please log in to continue' };
  }
  
  if (error.code === 403) {
    return { error: 'Forbidden', message: 'You do not have permission to perform this action' };
  }
  
  if (error.code === 404) {
    return { error: 'Not Found', message: 'The requested resource was not found' };
  }
  
  if (error.code === 409) {
    return { error: 'Conflict', message: 'A resource with this identifier already exists' };
  }
  
  return { 
    error: 'Unknown Error', 
    message: error.message || 'An unexpected error occurred' 
  };
};