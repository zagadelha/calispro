// EmailJS Configuration
// Para configurar o EmailJS:
// 1. Acesse https://www.emailjs.com/
// 2. Crie uma conta gratuita
// 3. Crie um serviço de email (Gmail é recomendado)
// 4. Crie um template de email com as seguintes variáveis:
//    - user_name
//    - user_email
//    - feedback_type
//    - message
//    - created_at
// 5. Copie as chaves abaixo para um arquivo .env.local

export const EMAILJS_CONFIG = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
    recipientEmail: 'calisproapp@gmail.com'
};
