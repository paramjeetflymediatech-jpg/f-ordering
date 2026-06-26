import { sequelize, Order, Customer, OrderItem } from './models';

async function main() {
  await sequelize.authenticate();
  
  const order = await Order.findOne({
    where: { order_number: 'ORD-ONL-00006' },
    include: [Customer, OrderItem],
  });

  if (order) {
    console.log('Order Found in DB!');
    console.log('Order Details:', {
      id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount,
      status: order.status,
    });
    console.log('Customer Linked:', {
      id: (order as any).Customer?.id,
      name: (order as any).Customer?.name,
      phone: (order as any).Customer?.phone,
      email: (order as any).Customer?.email,
    });
    console.log('Order Items:', (order as any).OrderItems?.map((oi: any) => ({
      menu_item_id: oi.menu_item_id,
      quantity: oi.quantity,
      total_price: oi.total_price,
    })));
  } else {
    console.log('Order ORD-ONL-00006 not found in DB!');
  }
  
  process.exit(0);
}

main().catch(console.error);
