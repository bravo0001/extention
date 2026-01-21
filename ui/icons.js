/**
 * SafeChat SVG Icons
 * Color-coded shield icons for different toxicity states
 */

const SafeChatIcons = {
    /**
     * Green shield - Clean text
     */
    clean: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z" fill="#10b981" stroke="#059669" stroke-width="1.5"/>
        <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    /**
     * Yellow shield - Mild toxicity
     */
    warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
        <path d="M12 8V13M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    /**
     * Red shield - High toxicity
     */
    danger: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z" fill="#ef4444" stroke="#dc2626" stroke-width="1.5"/>
        <path d="M9 9L15 15M15 9L9 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    /**
     * Blue shield - Processing
     */
    processing: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z" fill="#3b82f6" stroke="#2563eb" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="3" stroke="white" stroke-width="2" stroke-dasharray="4 2" class="safechat-spinner"/>
    </svg>`,

    /**
     * Gray shield - Disabled/Inactive
     */
    inactive: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z" fill="#9ca3af" stroke="#6b7280" stroke-width="1.5"/>
        <path d="M12 8V13M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>`
};

// Export for use in content scripts
if (typeof window !== 'undefined') {
    window.SafeChatIcons = SafeChatIcons;
}
