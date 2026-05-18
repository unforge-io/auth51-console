import { redirect } from 'next/navigation'

/**
 * /console/workflows is a parent slot — redirect to the default child view.
 */
export default function WorkflowsIndex() {
  redirect('/console/workflows/inferred')
}
