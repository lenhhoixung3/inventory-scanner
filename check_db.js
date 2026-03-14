const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const products = await prisma.product.findMany()
    console.log('CONNECTED_SUCCESSFULLY')
    console.log('PRODUCTS_COUNT:', products.length)
  } catch (e) {
    console.error('CONNECTION_FAILED')
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
