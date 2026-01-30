const PERMISSIONS = {
  // 3 SUBJECTS: admin, donor, orphanage (staff)
  // 3 OBJECTS: donation, profile, expense_proof

  admin: {
    donation: ['create', 'read', 'update', 'delete'],
    profile: ['read', 'update', 'delete'],
    expense_proof: ['create', 'read', 'update', 'delete']
  },
  donor: {
    donation: ['create', 'read_own'], // 'read_own' is a custom action handled by logic
    profile: ['read_own', 'update_own'],
    expense_proof: ['read']
  },
  staff: { // "orphanage" implicit role
    donation: ['read'],
    profile: ['read_own'],
    expense_proof: ['create', 'read', 'update']
  }
};

/**
 * ACL Middleware
 * @param {Array<string>} allowedRoles - List of roles that can access this route (Coarse-grained)
 * @param {string} resource - The resource being accessed (Fine-grained)
 * @param {string} action - The action being performed (Fine-grained)
 */
module.exports = (allowedRoles, resource = null, action = null) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    // 1. Coarse-grained Role Check
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access Forbidden: Insufficient Role" });
    }

    // 2. Fine-grained Permission Check (if resource/action provided)
    if (resource && action) {
      const rolePermissions = PERMISSIONS[userRole];
      if (!rolePermissions || !rolePermissions[resource] || !rolePermissions[resource].includes(action)) {
        // Handle special "own" cases if needed, but for now strict block
        return res.status(403).json({ message: `Access Forbidden: Cannot ${action} ${resource}` });
      }
    }

    next();
  };
};
