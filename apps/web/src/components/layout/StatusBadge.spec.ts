import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatusBadge from './StatusBadge.vue';

describe('StatusBadge', () => {
  it('renders the timesheet status', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'approved' } });
    expect(wrapper.text()).toContain('approved');
  });
});
