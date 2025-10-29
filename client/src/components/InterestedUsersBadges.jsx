import { groupInterestedByCouples } from '../utils/coupleUtils'
import { useAuthContext } from '../utils/AuthContext'

export function InterestedUsersBadges({ claims, profiles }) {
  const { user } = useAuthContext()

  // Group interested users by couples
  const groups = groupInterestedByCouples(claims, profiles)

  // Filter out groups that include the current user
  const otherGroups = groups.filter(group => !group.userIds.includes(user?.id))

  // Only show if there are interested parties other than the current user
  if (otherGroups.length === 0) {
    return null
  }

  return (
    <div className="interested-users-container">
      {otherGroups.map((group, index) => {
        const displayName = group.isCouple
          ? `${group.profiles[0].first_name || group.profiles[0].full_name} & ${group.profiles[1].first_name || group.profiles[1].full_name}`
          : (group.profiles[0].first_name || group.profiles[0].full_name)

        return (
          <div key={index} className="interested-user-badge">
            <span className="material-symbols-rounded interested-user-icon">favorite</span>
            <span className="interested-user-name">{displayName}</span>
          </div>
        )
      })}
    </div>
  )
}
