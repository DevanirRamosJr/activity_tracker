import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const changePassword = vi.fn()
vi.mock('../composables/useAuth', () => ({
  useAuth: () => ({ changePassword }),
}))

import ChangePasswordModal from './ChangePasswordModal.vue'

function fill(wrapper, { current, next, confirm }) {
  const inputs = wrapper.findAll('input')
  return Promise.all([
    inputs[0].setValue(current),
    inputs[1].setValue(next),
    inputs[2].setValue(confirm),
  ])
}

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    changePassword.mockReset()
  })

  it('shows a validation error when fields are empty', async () => {
    const wrapper = mount(ChangePasswordModal)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('All fields are required')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('rejects mismatched new passwords', async () => {
    const wrapper = mount(ChangePasswordModal)
    await fill(wrapper, { current: 'admin', next: 'abcd', confirm: 'abce' })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('New passwords do not match')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('rejects a too-short new password', async () => {
    const wrapper = mount(ChangePasswordModal)
    await fill(wrapper, { current: 'admin', next: 'ab', confirm: 'ab' })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('at least 4 characters')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('rejects reusing the current password', async () => {
    const wrapper = mount(ChangePasswordModal)
    await fill(wrapper, { current: 'admin', next: 'admin', confirm: 'admin' })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('different from the current one')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('calls changePassword and shows success on a valid submit', async () => {
    changePassword.mockResolvedValue({ success: true })
    const wrapper = mount(ChangePasswordModal)
    await fill(wrapper, { current: 'admin', next: 'newpass', confirm: 'newpass' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(changePassword).toHaveBeenCalledWith('admin', 'newpass')
    expect(wrapper.text()).toContain('Password updated.')
    // Save button is replaced by a Close action after success.
    expect(wrapper.findAll('button').some(b => b.text() === 'Save')).toBe(false)
  })

  it('surfaces the error returned by changePassword', async () => {
    changePassword.mockResolvedValue({ success: false, error: 'Current password is incorrect' })
    const wrapper = mount(ChangePasswordModal)
    await fill(wrapper, { current: 'wrong', next: 'newpass', confirm: 'newpass' })
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Current password is incorrect')
  })

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mount(ChangePasswordModal)
    const cancel = wrapper.findAll('button').find(b => b.text() === 'Cancel')
    await cancel.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

// Minimal flushPromises helper for awaiting async submit handlers.
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
