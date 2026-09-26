<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateCompanyRequest;
use App\Models\Company;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    /**
     * Show the company edit page for the authenticated industry partner.
     */
    public function edit(Request $request): Response
    {
        $company = Company::where('owner_user_id', $request->user()->id)->first();

        return Inertia::render('Company/Edit', [
            'company' => $company,
        ]);
    }

    /**
     * Create a new company for the authenticated user.
     */
    public function store(UpdateCompanyRequest $request): RedirectResponse
    {
        if (! $request->user()->can('create', Company::class)) {
            return redirect()->route('company.edit')
                ->with('error', 'You already have a company profile. Edit it instead.');
        }

        try {
            Company::create([
                ...$request->validated(),
                'owner_user_id' => $request->user()->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            // Double-submitted form: the row the second request would create
            // already exists, so land on the same page as the first one.
            return redirect()->route('company.edit')
                ->with('error', 'You already have a company profile. Edit it instead.');
        }

        return redirect()->route('company.edit')->with('success', 'Company created.');
    }

    /**
     * Update the authenticated user's company.
     */
    public function update(UpdateCompanyRequest $request): RedirectResponse
    {
        $company = Company::where('owner_user_id', $request->user()->id)->firstOrFail();

        $this->authorize('update', $company);

        $company->fill($request->validated())->save();

        return back()->with('success', 'Company updated.');
    }
}
