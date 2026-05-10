// Slack Block Kit helpers for building App Home views and modals

export function divider(): any {
  return { type: 'divider' };
}

export function section(text: string, accessory?: any): any {
  const block: any = {
    type: 'section',
    text: { type: 'mrkdwn', text },
  };
  if (accessory) block.accessory = accessory;
  return block;
}

export function header(text: string): any {
  return {
    type: 'header',
    text: { type: 'plain_text', text, emoji: true },
  };
}

export function button(text: string, actionId: string, value?: string, style?: 'primary' | 'danger'): any {
  const btn: any = {
    type: 'button',
    text: { type: 'plain_text', text, emoji: true },
    action_id: actionId,
  };
  if (value) btn.value = value;
  if (style) btn.style = style;
  return btn;
}

export function actions(...elements: any[]): any {
  return { type: 'actions', elements };
}

export function context(text: string): any {
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text }],
  };
}

// Modal building blocks
export function textInput(
  actionId: string,
  label: string,
  placeholder?: string,
  optional?: boolean,
  multiline?: boolean,
  initialValue?: string
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: multiline ? 'plain_text_input' : 'plain_text_input',
      action_id: actionId,
      multiline: !!multiline,
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  if (initialValue) input.element.initial_value = initialValue;
  return input;
}

export function numberInput(
  actionId: string,
  label: string,
  placeholder?: string,
  optional?: boolean,
  initialValue?: string
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'number_input',
      action_id: actionId,
      is_decimal_allowed: true,
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  if (initialValue) input.element.initial_value = initialValue;
  return input;
}

export function datePicker(
  actionId: string,
  label: string,
  placeholder?: string,
  optional?: boolean,
  initialDate?: string
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'datepicker',
      action_id: actionId,
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  if (initialDate) input.element.initial_date = initialDate;
  return input;
}

export function timePicker(
  actionId: string,
  label: string,
  placeholder?: string,
  optional?: boolean,
  initialTime?: string
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'timepicker',
      action_id: actionId,
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  if (initialTime) input.element.initial_time = initialTime;
  return input;
}

export function staticSelect(
  actionId: string,
  label: string,
  options: { text: string; value: string }[],
  placeholder?: string,
  optional?: boolean,
  initialOption?: { text: string; value: string }
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'static_select',
      action_id: actionId,
      options: options.map(o => ({
        text: { type: 'plain_text', text: o.text, emoji: true },
        value: o.value,
      })),
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  if (initialOption) {
    input.element.initial_option = {
      text: { type: 'plain_text', text: initialOption.text, emoji: true },
      value: initialOption.value,
    };
  }
  return input;
}

export function externalSelect(
  actionId: string,
  label: string,
  placeholder?: string,
  optional?: boolean,
  minQueryLength?: number
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'external_select',
      action_id: actionId,
      min_query_length: minQueryLength || 1,
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  return input;
}

export function multiExternalSelect(
  actionId: string,
  label: string,
  placeholder?: string,
  optional?: boolean,
  minQueryLength?: number
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'multi_external_select',
      action_id: actionId,
      min_query_length: minQueryLength || 1,
    },
    optional: !!optional,
  };
  if (placeholder) input.element.placeholder = { type: 'plain_text', text: placeholder };
  return input;
}

export function checkboxGroup(
  actionId: string,
  label: string,
  options: { text: string; value: string }[],
  optional?: boolean
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'checkboxes',
      action_id: actionId,
      options: options.map(o => ({
        text: { type: 'plain_text', text: o.text, emoji: true },
        value: o.value,
      })),
    },
    optional: !!optional,
  };
  return input;
}

export function radioButtons(
  actionId: string,
  label: string,
  options: { text: string; value: string }[],
  optional?: boolean
): any {
  const input: any = {
    type: 'input',
    block_id: actionId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'radio_buttons',
      action_id: actionId,
      options: options.map(o => ({
        text: { type: 'plain_text', text: o.text, emoji: true },
        value: o.value,
      })),
    },
    optional: !!optional,
  };
  return input;
}

export function option(text: string, value: string): { text: string; value: string } {
  return { text, value };
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
}

export function formatDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
