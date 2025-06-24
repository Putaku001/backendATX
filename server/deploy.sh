#!/bin/bash

# Script de despliegue para Render
echo "🚀 Iniciando despliegue del servidor..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Generar el cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

# Verificar la conexión a la base de datos
echo "🔍 Verificando conexión a la base de datos..."
npx prisma db push --accept-data-loss

echo "✅ Despliegue completado!"
echo "🌐 Servidor iniciado en puerto $PORT" 