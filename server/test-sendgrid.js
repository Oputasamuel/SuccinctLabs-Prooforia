import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.log('SENDGRID_API_KEY not found');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'joetrench22@gmail.com',
  from: 'joetrench22@gmail.com', // Use your verified sender
  subject: 'SendGrid Test Email',
  text: 'This is a test email to verify SendGrid configuration.',
  html: '<p>This is a test email to verify SendGrid configuration.</p>',
};

sgMail.send(msg)
  .then((response) => {
    console.log('Email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
  })
  .catch((error) => {
    console.error('SendGrid Error Details:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status Code:', error.response.statusCode);
      console.error('Body:', error.response.body);
    }
  });