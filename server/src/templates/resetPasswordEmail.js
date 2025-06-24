const resetPasswordEmail = (username, resetToken) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecimiento de Contraseña - AnimeTrackerX</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      
      <!-- Wrapper principal -->
      <div style="width: 100%; padding: 40px 20px; background-color: #f8fafc;">
        
        <!-- Container del email -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 36px; font-weight: 700; background: linear-gradient(45deg, #ffffff, #e0e7ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: white;">
              AnimeTrackerX
            </h1>
          </div>

          <!-- Contenido principal -->
          <div style="padding: 50px 40px;">
            
            <!-- Título -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600; color: #1f2937;">Restablecimiento de Contraseña</h2>
              <p style="margin: 0; font-size: 16px; color: #6b7280;">Hola <strong style="color: #667eea;">${username || 'usuario'}</strong></p>
            </div>

            <!-- Mensaje principal -->
            <div style="margin-bottom: 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Utiliza el siguiente código de verificación para completar el proceso:
              </p>
            </div>

            <!-- Código de verificación -->
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background-color: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px 32px;">
                <span style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 4px;">${resetToken}</span>
              </div>
            </div>

            <!-- Información importante -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 4px; margin: 40px 0;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">Información importante:</h4>
              <ul style="margin: 0; padding-left: 16px; font-size: 14px; line-height: 1.5; color: #92400e;">
                <li>Este código expira en 10 minutos</li>
                <li>Solo puede ser usado una vez</li>
                <li>No compartas este código con nadie</li>
              </ul>
            </div>

            <!-- Nota de seguridad -->
            <div style="margin: 40px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                Si no solicitaste este restablecimiento de contraseña, puedes ignorar este correo electrónico de forma segura. Tu cuenta permanecerá segura.
              </p>
            </div>

            <!-- Botón de soporte -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="#" style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                Contactar Soporte
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 30px 40px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
              Este es un correo electrónico automático, por favor no responder.
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              © 2025 AnimeTrackerX. Todos los derechos reservados.
            </p>
          </div>

        </div>
      </div>

    </body>
    </html>
  `;
};

export default resetPasswordEmail; 