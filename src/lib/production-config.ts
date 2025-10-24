// Production-specific configuration
export const productionConfig = {
  appwrite: {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: '68f4f8c8002cda88c2ef',
    databaseId: 'hospital_main',
    apiKey: 'standard_446c5a3207d9a3b0eaae4675838ae70da9a07b34795e5553807e4d8ecc722cc10eb05d32395d74ffb74ea4baa884194776061f435cec7fff4f45541efe970ce02388fcad185965d9fe60136e629a4856c2bd284f092dbe43cf45322af2f2cb599feb6a8cffaf4d04d6409bfc0106dc9c5f185483ed49cf0975d2078992e272aa'
  },
  nextauth: {
    url: 'https://hospital-v1.appwrite.network',
    secret: 'hlYh13l4WYCXm2tSTmGUlK2ZrdvaeYvkURsu77hGHp8='
  }
}

// Check if we're in production
export const isProduction = process.env.NODE_ENV === 'production'

// Get configuration based on environment
export const getConfig = () => {
  if (isProduction) {
    return {
      APPWRITE_ENDPOINT: productionConfig.appwrite.endpoint,
      APPWRITE_PROJECT_ID: productionConfig.appwrite.projectId,
      APPWRITE_DATABASE_ID: productionConfig.appwrite.databaseId,
      APPWRITE_API_KEY: productionConfig.appwrite.apiKey,
      NEXTAUTH_URL: productionConfig.nextauth.url,
      NEXTAUTH_SECRET: productionConfig.nextauth.secret
    }
  }
  
  return {
    APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  }
}
