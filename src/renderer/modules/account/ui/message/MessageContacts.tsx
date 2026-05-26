/**
 * Message Center — personal contact notebook (server-synced).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  BookUser, Plus, Search, Mail, Phone, Trash2, Pencil, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import {
  useGetMessageContacts,
  useCreateMessageContact,
  useUpdateMessageContact,
  useDeleteMessageContact,
} from '../../api/messageContacts/MessageContactQueries';
import type { MessageContact } from '../../api/messageContacts/MessageContactTypes';
import {
  custocareUserName,
  filterMessageContacts,
} from '../../api/messageContacts/messageContactDisplay';
import { validateEmail } from '../../../../shared/utils/phoneNumber';
import {
  MessageContactFormDrawer,
  type ContactFormData,
} from './components/MessageContactFormDrawer';

const CONTACTS_FETCH_PAGE_SIZE = 100;

interface MessageContactsProps {
  theme: 'light' | 'dark';
}

const emptyForm = (): ContactFormData => ({
  display_name: '',
  email: '',
  phone: '',
});

interface NewContactButtonProps {
  isDark: boolean;
  onClick: () => void;
  variant?: 'primary' | 'outline';
  className?: string;
}

const NewContactButton: React.FC<NewContactButtonProps> = ({
  isDark,
  onClick,
  variant = 'primary',
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex shrink-0 items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium cursor-pointer',
      variant === 'primary'
        ? isDark
          ? 'border-blue-500/50 bg-blue-600 text-white hover:bg-blue-500'
          : 'border-blue-400 bg-blue-600 text-white hover:bg-blue-700'
        : isDark
          ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
          : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
      className,
    )}
  >
    <Plus className="h-4 w-4" /> New contact
  </button>
);

const MessageContacts: React.FC<MessageContactsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<MessageContact | null>(null);
  const [form, setForm] = useState<ContactFormData>(emptyForm);

  const { data, isLoading, refetch, isRefetching } = useGetMessageContacts({
    per_page: CONTACTS_FETCH_PAGE_SIZE,
  });

  const createMutation = useCreateMessageContact();
  const updateMutation = useUpdateMessageContact();
  const deleteMutation = useDeleteMessageContact();

  const allContacts = data?.data ?? [];
  const filteredContacts = useMemo(
    () => filterMessageContacts(allContacts, searchQuery),
    [allContacts, searchQuery],
  );

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openCreate = () => {
    setDrawerMode('create');
    setEditing(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (c: MessageContact) => {
    setDrawerMode('edit');
    setEditing(c);
    setForm({
      display_name: c.display_name,
      email: c.email ?? '',
      phone: c.phone ?? '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const canSubmit = useMemo(() => {
    const name = form.display_name.trim();
    const hasEmail = form.email.trim() && validateEmail(form.email.trim());
    const hasPhone = form.phone.trim().length >= 10;
    return Boolean(name && (hasEmail || hasPhone));
  }, [form]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = {
      display_name: form.display_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => { closeDrawer(); refetch(); } },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { closeDrawer(); refetch(); },
      });
    }
  };

  const handleDelete = useCallback(
    async (c: MessageContact) => {
      const confirmed = await confirm({
        title: 'Remove contact',
        message: `Remove "${c.display_name}" from your contacts? This action cannot be undone.`,
        confirmText: 'Remove contact',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      deleteMutation.mutate(c.id, { onSuccess: () => refetch() });
    },
    [confirm, theme, deleteMutation, refetch],
  );

  const hasSearch = searchQuery.trim().length > 0;
  const showNoSearchResults = !isLoading && allContacts.length > 0 && filteredContacts.length === 0;
  const showEmptyNotebook = !isLoading && allContacts.length === 0;

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div>
        <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          Contacts
        </h2>
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Your saved people — search by name, Custocare account, email, or phone.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search
            className={cn(
              'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
              isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, or phone…"
            className={cn(
              'w-full rounded-lg border-2 py-2 pl-10 pr-3 text-sm outline-none',
              isDark
                ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500'
                : 'border-gray-300 bg-white text-gray-900',
            )}
          />
        </div>
        <NewContactButton isDark={isDark} onClick={openCreate} />
      </div>

      {hasSearch && !isLoading && (
        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
          {filteredContacts.length} of {allContacts.length} contact
          {allContacts.length === 1 ? '' : 's'} match your search
        </p>
      )}

      {isLoading ? (
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Loading contacts…</p>
      ) : showEmptyNotebook ? (
        <div
          className={cn(
            'flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center',
            isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500',
          )}
        >
          <BookUser className="h-12 w-12 opacity-50" />
          <div>
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="mt-1 text-xs opacity-80">
              Add someone you message on Custocare — email or phone must match their account.
            </p>
          </div>
          <NewContactButton isDark={isDark} onClick={openCreate} />
        </div>
      ) : showNoSearchResults ? (
        <div
          className={cn(
            'flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-8 text-center',
            isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500',
          )}
        >
          <Search className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            No contacts match &ldquo;{searchQuery.trim()}&rdquo;.
          </p>
          <NewContactButton isDark={isDark} onClick={openCreate} variant="outline" />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((c) => (
            <li
              key={c.id}
              className={cn(
                'rounded-xl border-2 p-4 transition-shadow hover:shadow-md',
                isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white',
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn('truncate font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    {c.display_name}
                  </p>
                  {custocareUserName(c) && (
                    <p className={cn('truncate text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      Custocare: {custocareUserName(c)}
                    </p>
                  )}
                  {c.can_message ? (
                    <span className={cn('inline-flex items-center gap-1 text-xs', isDark ? 'text-green-400' : 'text-green-700')}>
                      <CheckCircle2 className="h-3 w-3" /> On Custocare
                    </span>
                  ) : (
                    <span className={cn('inline-flex items-center gap-1 text-xs', isDark ? 'text-amber-400' : 'text-amber-700')}>
                      <AlertCircle className="h-3 w-3" /> Not on Custocare
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className={cn('rounded p-1.5 cursor-pointer', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className={cn('rounded p-1.5 cursor-pointer text-red-500', isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {c.email && (
                <p className={cn('flex items-center gap-1.5 truncate text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  <Mail className="h-3 w-3 shrink-0" /> {c.email}
                </p>
              )}
              {c.phone && (
                <p className={cn('mt-1 flex items-center gap-1.5 truncate text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  <Phone className="h-3 w-3 shrink-0" /> {c.phone}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <MessageContactFormDrawer
        theme={theme}
        mode={drawerMode}
        open={drawerOpen}
        formData={form}
        onChange={setForm}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
        canSubmit={canSubmit}
      />

      {(isRefetching && !isLoading) && (
        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Refreshing…</p>
      )}
    </div>
  );
};

export default MessageContacts;
