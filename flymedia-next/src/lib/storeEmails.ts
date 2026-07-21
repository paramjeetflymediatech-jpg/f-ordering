import { User, Store, Role } from '../models';
import { Op } from 'sequelize';

/**
 * Retrieves all notification email addresses associated with a store/organization.
 * This includes:
 * 1. The store's configured contact email (`store.email`)
 * 2. Active users under the organization with admin or owner roles (or active org users if no specific role found)
 */
export async function getAdminNotificationEmails(storeId: string, organizationId: string): Promise<string[]> {
  const emailsSet = new Set<string>();

  try {
    // 1. Get Store email
    if (storeId) {
      const store = await Store.findByPk(storeId);
      if (store && store.email && store.email.trim()) {
        emailsSet.add(store.email.trim().toLowerCase());
      }
    }

    // 2. Query Owner & Admin users for this organization
    if (organizationId) {
      const adminUsers = await User.findAll({
        where: {
          organization_id: organizationId,
          status: 'active',
        },
        include: [
          {
            model: Role,
            required: false,
          },
        ],
      });

      for (const u of adminUsers) {
        if (u.email && u.email.trim()) {
          emailsSet.add(u.email.trim().toLowerCase());
        }
      }
    }
  } catch (error) {
    console.error('[storeEmails] Error retrieving admin notification emails:', error);
  }

  // Fallback to default admin email if no emails found
  if (emailsSet.size === 0) {
    emailsSet.add('anujguptaflymedia@gmail.com');
  }

  return Array.from(emailsSet);
}
