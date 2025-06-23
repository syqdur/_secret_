export const translations = {
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    upload: "Upload",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    share: "Share",
    like: "Like",
    comment: "Comment",
    
    // Gallery
    galleryLoading: "Loading gallery...",
    galleryNotFound: "Gallery not found",
    invalidGalleryLink: "Invalid Gallery Link",
    galleryLinkInvalid: "The gallery link appears to be invalid.",
    
    // Authentication
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    
    // Visitor
    welcomeToGallery: "Welcome to our Gallery!",
    enterYourName: "Please enter your name to continue",
    yourName: "Your name",
    joinGallery: "Join Gallery",
    
    // Upload
    uploadPhotoVideo: "Upload Photo/Video",
    addStory: "Add Story",
    selectFile: "Select File",
    dragAndDrop: "Drag and drop files here, or click to select",
    supportedFormats: "Supported formats: JPG, PNG, MP4, MOV",
    addCaption: "Add a caption (optional)",
    uploadMedia: "Upload Media",
    uploadStory: "Upload Story",
    uploading: "Uploading...",
    uploadError: "Upload Error",
    uploadSuccess: "Upload Successful",
    missingFileInfo: "Missing file, gallery, or visitor information",
    postUploaded: "Your post has been uploaded!",
    storyUploaded: "Your story has been uploaded!",
    
    // Feed
    noMediaYet: "No media uploaded yet",
    beFirstToUpload: "Be the first to share a photo or video!",
    likesCount: "likes",
    commentsCount: "comments",
    addComment: "Add a comment...",
    postComment: "Post",
    
    // Stories
    noStoriesYet: "No stories yet",
    addFirstStory: "Add the first story!",
    viewStory: "View story",
    
    // Admin
    adminPanel: "Admin Panel",
    gallerySettings: "Gallery Settings",
    galleryName: "Gallery Name",
    galleryBio: "Gallery Bio",
    updateSettings: "Update Settings",
    previewGuestView: "Preview Guest View",
    guestCapabilities: "What guests can do:",
    guestCanView: "• View all photos and videos in the gallery",
    guestCanUpload: "• Upload their own photos and videos",
    guestCanStories: "• Add 24-hour stories that disappear automatically",
    guestCanInteract: "• Like and comment on posts",
    guestCanEdit: "• Only edit or delete their own content",
  },
  de: {
    // Common
    loading: "Lädt...",
    error: "Fehler",
    success: "Erfolg",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    upload: "Hochladen",
    close: "Schließen",
    back: "Zurück",
    next: "Weiter",
    previous: "Vorherige",
    share: "Teilen",
    like: "Gefällt mir",
    comment: "Kommentar",
    
    // Gallery
    galleryLoading: "Galerie wird geladen...",
    galleryNotFound: "Galerie nicht gefunden",
    invalidGalleryLink: "Ungültiger Galerie-Link",
    galleryLinkInvalid: "Der Galerie-Link scheint ungültig zu sein.",
    
    // Authentication
    signIn: "Anmelden",
    signUp: "Registrieren",
    signOut: "Abmelden",
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    
    // Visitor
    welcomeToGallery: "Willkommen in unserer Galerie!",
    enterYourName: "Bitte geben Sie Ihren Namen ein, um fortzufahren",
    yourName: "Ihr Name",
    joinGallery: "Galerie beitreten",
    
    // Upload
    uploadPhotoVideo: "Foto/Video hochladen",
    addStory: "Story hinzufügen",
    selectFile: "Datei auswählen",
    dragAndDrop: "Dateien hier hineinziehen oder klicken zum Auswählen",
    supportedFormats: "Unterstützte Formate: JPG, PNG, MP4, MOV",
    addCaption: "Beschreibung hinzufügen (optional)",
    uploadMedia: "Medien hochladen",
    uploadStory: "Story hochladen",
    uploading: "Lädt hoch...",
    uploadError: "Upload-Fehler",
    uploadSuccess: "Upload erfolgreich",
    missingFileInfo: "Datei-, Galerie- oder Besucherinformationen fehlen",
    postUploaded: "Ihr Beitrag wurde hochgeladen!",
    storyUploaded: "Ihre Story wurde hochgeladen!",
    
    // Feed
    noMediaYet: "Noch keine Medien hochgeladen",
    beFirstToUpload: "Seien Sie der Erste, der ein Foto oder Video teilt!",
    likesCount: "Gefällt mir",
    commentsCount: "Kommentare",
    addComment: "Kommentar hinzufügen...",
    postComment: "Posten",
    
    // Stories
    noStoriesYet: "Noch keine Stories",
    addFirstStory: "Erste Story hinzufügen!",
    viewStory: "Story ansehen",
    
    // Admin
    adminPanel: "Admin-Panel",
    gallerySettings: "Galerie-Einstellungen",
    galleryName: "Galerie-Name",
    galleryBio: "Galerie-Beschreibung",
    updateSettings: "Einstellungen aktualisieren",
    previewGuestView: "Gast-Ansicht vorschau",
    guestCapabilities: "Was Gäste tun können:",
    guestCanView: "• Alle Fotos und Videos in der Galerie ansehen",
    guestCanUpload: "• Eigene Fotos und Videos hochladen",
    guestCanStories: "• 24-Stunden-Stories hinzufügen, die automatisch verschwinden",
    guestCanInteract: "• Beiträge liken und kommentieren",
    guestCanEdit: "• Nur eigene Inhalte bearbeiten oder löschen",
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

let currentLanguage: Language = 'de'; // Default to German

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  localStorage.setItem('weddingpix_language', lang);
};

export const getLanguage = (): Language => {
  const saved = localStorage.getItem('weddingpix_language') as Language;
  return saved || currentLanguage;
};

export const t = (key: TranslationKey): string => {
  const lang = getLanguage();
  return translations[lang][key] || translations.en[key] || key;
};

// Initialize language from localStorage
if (typeof window !== 'undefined') {
  const savedLang = localStorage.getItem('weddingpix_language') as Language;
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  }
}