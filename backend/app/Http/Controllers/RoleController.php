<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Role Management Controller
 * 
 * Handles role CRUD operations for admin panel.
 * Note: This system uses a simplified role model without separate permissions table.
 * Roles: Admin, Inventory Manager, Staff
 */
class RoleController extends Controller
{
    /**
     * Get all roles
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $roles = Role::withCount('users')->get();
        
        return response()->json([
            'success' => true,
            'roles' => $roles
        ]);
    }

    /**
     * Get a single role by ID
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $role = Role::with('users:id,name,email,role_id')->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'role' => $role,
            'user_count' => $role->users->count()
        ]);
    }

    /**
     * Create a new role
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role_name' => 'required|string|max:255|unique:roles,role_name',
        ], [
            'role_name.required' => 'Rol adı zorunludur.',
            'role_name.unique' => 'Bu rol adı zaten kullanılıyor.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası.',
                'errors' => $validator->errors()
            ], 422);
        }

        $role = Role::create([
            'role_name' => $request->role_name
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rol başarıyla oluşturuldu.',
            'role' => $role
        ], 201);
    }

    /**
     * Update an existing role
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // Prevent editing default roles
        if (in_array($role->role_name, ['Admin', 'Inventory Manager', 'Staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Varsayılan roller düzenlenemez.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'role_name')->ignore($id)
            ],
        ], [
            'role_name.required' => 'Rol adı zorunludur.',
            'role_name.unique' => 'Bu rol adı zaten kullanılıyor.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Doğrulama hatası.',
                'errors' => $validator->errors()
            ], 422);
        }

        $role->update([
            'role_name' => $request->role_name
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rol başarıyla güncellendi.',
            'role' => $role
        ]);
    }

    /**
     * Delete a role
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        // Prevent deleting default roles
        if (in_array($role->role_name, ['Admin', 'Inventory Manager', 'Staff'])) {
            return response()->json([
                'success' => false,
                'message' => 'Varsayılan roller silinemez.'
            ], 403);
        }

        // Check if role has users
        $userCount = User::where('role_id', $id)->count();
        if ($userCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Bu rol $userCount kullanıcı tarafından kullanılıyor ve silinemez."
            ], 409);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rol başarıyla silindi.'
        ]);
    }

    /**
     * Get available permissions
     * 
     * Note: This is a simplified implementation.
     * In a full RBAC system, permissions would be in a separate table.
     * Here we return static permission definitions.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPermissions()
    {
        $permissions = [
            [
                'group' => 'Kullanıcı Yönetimi',
                'permissions' => [
                    ['name' => 'user.view', 'label' => 'Kullanıcıları Görüntüle'],
                    ['name' => 'user.create', 'label' => 'Kullanıcı Oluştur'],
                    ['name' => 'user.edit', 'label' => 'Kullanıcı Düzenle'],
                    ['name' => 'user.delete', 'label' => 'Kullanıcı Sil'],
                ]
            ],
            [
                'group' => 'Envanter Yönetimi',
                'permissions' => [
                    ['name' => 'item.view', 'label' => 'Ürünleri Görüntüle'],
                    ['name' => 'item.create', 'label' => 'Ürün Ekle'],
                    ['name' => 'item.edit', 'label' => 'Ürün Düzenle'],
                    ['name' => 'item.delete', 'label' => 'Ürün Sil'],
                ]
            ],
            [
                'group' => 'İşlem Yönetimi',
                'permissions' => [
                    ['name' => 'transaction.view', 'label' => 'İşlemleri Görüntüle'],
                    ['name' => 'transaction.checkout', 'label' => 'Ödünç Ver'],
                    ['name' => 'transaction.return', 'label' => 'İade Al'],
                ]
            ],
            [
                'group' => 'Talep Yönetimi',
                'permissions' => [
                    ['name' => 'request.view', 'label' => 'Talepleri Görüntüle'],
                    ['name' => 'request.create', 'label' => 'Talep Oluştur'],
                    ['name' => 'request.approve', 'label' => 'Talep Onayla'],
                    ['name' => 'request.assign', 'label' => 'Talep Ata'],
                ]
            ],
            [
                'group' => 'Raporlama',
                'permissions' => [
                    ['name' => 'report.view', 'label' => 'Raporları Görüntüle'],
                    ['name' => 'report.export', 'label' => 'Rapor Dışa Aktar'],
                ]
            ],
            [
                'group' => 'Sistem Ayarları',
                'permissions' => [
                    ['name' => 'settings.view', 'label' => 'Ayarları Görüntüle'],
                    ['name' => 'settings.edit', 'label' => 'Ayarları Düzenle'],
                    ['name' => 'backup.manage', 'label' => 'Yedekleme Yönet'],
                    ['name' => 'audit.view', 'label' => 'Denetim Loglarını Görüntüle'],
                ]
            ]
        ];

        // Add role-based permission mapping
        $rolePermissions = [
            'Admin' => [
                'all' => true,
                'description' => 'Tüm yetkilere sahiptir'
            ],
            'Inventory Manager' => [
                'permissions' => [
                    'item.*', 'transaction.*', 'request.view', 'request.create', 
                    'request.assign', 'request.approve', 'report.view', 'report.export'
                ],
                'description' => 'Envanter ve talep yönetimi yetkilerine sahiptir'
            ],
            'Staff' => [
                'permissions' => [
                    'item.view', 'transaction.view', 'request.view', 
                    'request.create', 'report.view'
                ],
                'description' => 'Görüntüleme ve temel talep oluşturma yetkilerine sahiptir'
            ]
        ];

        return response()->json([
            'success' => true,
            'permissions' => $permissions,
            'role_permissions' => $rolePermissions
        ]);
    }

    /**
     * Get assignable users (simplified list for dropdowns)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAssignableUsers()
    {
        $users = User::select('id', 'name', 'email', 'role_id')
            ->with('role:id,role_name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'users' => $users
        ]);
    }
}
