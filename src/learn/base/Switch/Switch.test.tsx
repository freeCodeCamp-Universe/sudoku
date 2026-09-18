import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '@/learn/base/Switch/Switch';

function Harness({ description }: { description?: string }) {
  const [checked, setChecked] = useState(false);

  return (
    <Switch
      checked={checked}
      onChange={setChecked}
      label="Enable animations"
      description={description}
    />
  );
}

describe('Switch', () => {
  it('should render an accessible switch with its label', () => {
    render(<Harness />);

    expect(screen.getByRole('switch', { name: 'Enable animations' })).toBeInTheDocument();
  });

  it('should toggle when clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const toggle = screen.getByRole('switch', { name: 'Enable animations' });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(toggle).toBeChecked();
  });

  it('should support a label positioned at the start', () => {
    render(
      <Switch checked={false} onChange={() => {}} label="Enable animations" labelPosition="start" />
    );

    expect(screen.getByRole('switch', { name: 'Enable animations' })).toBeInTheDocument();
  });

  it('should render the description and wire aria-describedby to it', () => {
    render(<Harness description="Controls motion in the course." />);

    const toggle = screen.getByRole('switch', { name: 'Enable animations' });
    const description = screen.getByText('Controls motion in the course.');

    expect(description).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-describedby', description.id);
  });

  it('should not set aria-describedby when no description is provided', () => {
    render(<Harness />);

    expect(screen.getByRole('switch', { name: 'Enable animations' })).not.toHaveAttribute(
      'aria-describedby'
    );
  });
});
