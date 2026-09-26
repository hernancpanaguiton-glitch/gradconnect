<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

/**
 * Company editing was authorized against a policy that did not exist, so
 * Laravel's implicit "deny when no ability is defined" made every partner's
 * Save button 403. One partner owns one company (companies.owner_user_id);
 * admins keep access for support work.
 */
class CompanyPolicy
{
    public function view(User $user, Company $company): bool
    {
        return $this->owns($user, $company) || $user->hasRole('admin');
    }

    /**
     * Creating is allowed only while the partner has no company — the
     * one-company-per-owner rule the unique index now enforces in the
     * database as well.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('company.manage')
            && ! Company::where('owner_user_id', $user->id)->exists();
    }

    public function update(User $user, Company $company): bool
    {
        return $this->owns($user, $company) || $user->hasRole('admin');
    }

    public function delete(User $user, Company $company): bool
    {
        return $user->hasRole('admin');
    }

    private function owns(User $user, Company $company): bool
    {
        return $company->owner_user_id === $user->id;
    }
}
