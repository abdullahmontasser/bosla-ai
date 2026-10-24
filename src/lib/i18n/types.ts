export interface Dictionary {
  common: {
    brand: string
    tagline: string
    language: string
    theme: string
    light: string
    dark: string
    system: string
    save: string
    cancel: string
    delete: string
    confirm: string
    close: string
    loading: string
    search: string
  }
  designSystem: {
    title: string
    subtitle: string
    colors: string
    typography: string
    buttons: string
    inputs: string
    cards: string
    badges: string
    dialogs: string
    dropdowns: string
    icons: string
    openDialog: string
    openMenu: string
    dialogTitle: string
    dialogDescription: string
    inputPlaceholder: string
    textareaPlaceholder: string
    cardTitle: string
    cardDescription: string
    cardAction: string
    editItem: string
    duplicateItem: string
    deleteItem: string
  }
  [key: string]: unknown
}
