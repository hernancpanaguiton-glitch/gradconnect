<?php

namespace App\Policies;

use App\Models\GraduateProfile;
use App\Models\User;

class GraduateProfilePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('graduate_profiles.view_all');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, GraduateProfile $graduateProfile): bool
    {
        return $user->id === $graduateProfile->user_id
            || $user->hasPermissionTo('graduate_profiles.view_all');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, GraduateProfile $graduateProfile): bool
    {
        return $user->id === $graduateProfile->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, GraduateProfile $graduateProfile): bool
    {
        return $user->id === $graduateProfile->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, GraduateProfile $graduateProfile): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, GraduateProfile $graduateProfile): bool
    {
        return false;
    }
}
