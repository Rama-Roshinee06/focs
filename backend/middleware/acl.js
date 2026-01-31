const PERMISSIONS = {
  admin: {
    donation: ['create', 'read', 'update', 'delete'],
    profile: ['read', 'update', 'delete'],
    expense_proof: ['create', 'read', 'update', 'delete']
  },
  donor: {
    donation: ['create', 'read_own'],
    profile: ['read_own', 'update_own'],
    expense_proof: ['read']
  },
  staff: {
    donation: ['read'],
    profile: ['read_own'],
    expense_proof: ['create', 'read', 'update']
  }
};

/**
 * ACL Middleware
 * @param {Array<string>} allowedRoles - List of roles that can access this route
 * @param {string} resource - The resource being accessed
 * @param {string} action - The action being performed
 */
module.exports = (allowedRoles, resource = null, action = null) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    // 1. Coarse-grained Role Check
    if (!allowedRoles.includes(userRole)) {
      const rolesString = allowedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(" or ");
      return res.status(403).json({
        message: `Access Denied: ${rolesString} Only`,
        error: "RBAC_REJECTION"
      });
    }

    // 2. Fine-grained Permission Check
    if (resource && action) {
      const rolePermissions = PERMISSIONS[userRole];
      if (!rolePermissions || !rolePermissions[resource] || !rolePermissions[resource].includes(action)) {
        return res.status(403).json({
          message: `Access Denied: Insufficient permissions to ${action} ${resource}`,
          error: "PERMISSION_REJECTION"
        });
      }
    }

    next();
  };
};

