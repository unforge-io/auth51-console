'use client'

import { CreateOrganization, OrganizationProfile, useAuth } from '@clerk/nextjs'

/**
 * Members — the team that shares this org's control planes, agents, grants and
 * API keys. Invitations, roles and removal are Clerk's org profile; everything
 * a member does in the console is scoped to the org's single Authority tenant.
 *
 * In a personal workspace there is nobody to share with yet, so we offer to
 * create an org instead.
 */
export default function MembersPage() {
  const { isLoaded, orgId } = useAuth()
  if (!isLoaded) return null

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-[22px] font-semibold text-c-text tracking-tight mb-2">Members</h1>
      {orgId ? (
        <>
          <p className="text-[13.5px] text-c-text-2 leading-relaxed mb-6 max-w-2xl">
            Everyone in this organization shares the same control planes, registered agents,
            grants and API keys. Invite teammates and manage their roles here.
          </p>
          <OrganizationProfile routing="hash" />
        </>
      ) : (
        <>
          <p className="text-[13.5px] text-c-text-2 leading-relaxed mb-6 max-w-2xl">
            You&apos;re in your personal workspace — only you can see its control planes and keys.
            Create an organization to share them with your team. Anything you set up after
            switching to the organization is visible to all of its members.
          </p>
          <CreateOrganization routing="hash" afterCreateOrganizationUrl="/console/settings/members" />
        </>
      )}
    </div>
  )
}
