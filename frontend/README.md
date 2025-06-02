1. Abre una terminal (CMD o PowerShell)
2. Navega a la carpeta del backend
bash
CopyInsert in Terminal
cd c:\Users\cs587\OneDrive\Escritorio\SecureChat\backend
3. Inicia el servidor
bash
CopyInsert in Terminal
npm start
o

bash
CopyInsert in Terminal
node server.js
4. Obtén tu IP local
En la misma terminal, ejecuta:

bash
CopyInsert in Terminal
ipconfig
Busca la sección de tu conexión WiFi y anota el número de "Dirección IPv4" (ejemplo: 192.168.1.5)

5. Abre otra terminal para el frontend
Presiona Ctrl + Shift + N para abrir una nueva ventana de terminal
Navega a la carpeta del frontend:
bash
CopyInsert in Terminal
cd c:\Users\cs587\OneDrive\Escritorio\SecureChat\frontend
Inicia el cliente:
bash
CopyInsert in Terminal
npm run dev
6. Accede a la aplicación
En tu navegador, ve a: http://localhost:3000
O comparte esta URL con otros en la misma red: http://[tu-ip]:3000 (reemplaza [tu-ip] con la IP del paso 4)
7. Para otros dispositivos
Asegúrate de que estén en la misma red WiFi
Abre un navegador y ve a: http://[tu-ip]:3000
8. Para detener el servidor
En ambas terminales, presiona Ctrl + C
Confirma con Y y presiona Enter
Notas importantes:
El servidor debe estar en ejecución mientras uses la aplicación
Si cambias de red, repite los pasos 4-6
Si tienes problemas con el firewall, asegúrate de permitir conexiones en los puertos 3000 (frontend) y 3001 (backend)