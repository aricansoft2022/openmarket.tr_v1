# Supplier S01-S04 source contract

## Source lines 584-723

00584: 
00585: - Email and password
00586: - Google OAuth
00587: 
00588: Initial required fields:
00589: 
00590: - Full name
00591: - Email
00592: - Country
00593: - Preferred UI language
00594: - Intended use: Buyer, Supplier or Both
00595: 
00596: Personal phone is optional.
00597: 
00598: ### 11.2 Company-email verification
00599: 
00600: If registration uses a verified company-domain email, account and company-email verification can complete together.
00601: 
00602: Public email providers verify the account only. A company email or an approved manual business-identity exception is required before commercial interaction.
00603: 
00604: Admin manages:
00605: 
00606: - Public-email domains
00607: - Domain exceptions
00608: - Blocked domains
00609: - Manual overrides
00610: - Business-identity review notes
00611: 
00612: ### 11.3 Buyer activation
00613: 
00614: A buyer becomes commercially active after business identity verification.
00615: 
00616: No buyer documents are required at launch unless abuse, sanctions or fraud review requires manual intervention.
00617: 
00618: ### 11.4 Supplier activation
00619: 
00620: A supplier becomes commercially active after:
00621: 
00622: - Company email or approved business-identity verification
00623: - Minimum company profile
00624: - Supplier type selection
00625: - Company-document upload
00626: - Approval of mandatory company documents
00627: 
00628: Before activation, a supplier can:
00629: 
00630: - Build the company profile
00631: - Create product drafts
00632: - Define products and variants
00633: - Upload company and claim documents
00634: 
00635: Before activation, a supplier cannot:
00636: 
00637: - Publish products
00638: - Respond to RFQs
00639: - Receive direct commercial enquiries
00640: - Reveal contact details through interaction
00641: 
00642: After activation, complete product drafts can publish automatically.
00643: 
00644: ### 11.5 Account states
00645: 
00646: Base account:
00647: 
00648: ```text
00649: UNREGISTERED → REGISTERED → ACCOUNT_VERIFIED → BUSINESS_IDENTITY_VERIFIED
00650: ```
00651: 
00652: Buyer:
00653: 
00654: ```text
00655: BROWSER → ACTIVE_BUYER → SUSPENDED_BUYER
00656: ```
00657: 
00658: Supplier:
00659: 
00660: ```text
00661: SUPPLIER_DRAFT
00662: → COMPANY_DOCUMENTS_REQUIRED
00663: → COMPANY_DOCUMENTS_PENDING
00664: → ACTIVE_SUPPLIER
00665: ```
00666: 
00667: Additional supplier states:
00668: 
00669: - COMPANY_DOCUMENTS_REJECTED
00670: - REACTIVATION_REQUIRED
00671: - SUSPENDED_SUPPLIER
00672: 
00673: Product-claim review states do not automatically change the supplier activation state.
00674: 
00675: ## 12. Documents and evidence review
00676: 
00677: ### 12.1 Company documents
00678: 
00679: Mandatory company-document rules can vary by supplier type.
00680: 
00681: Seeded documents:
00682: 
00683: - Chamber or activity document
00684: - Trade registry record
00685: - Tax or company registration
00686: - Authorized representative evidence
00687: - Company address evidence
00688: - Exporter information where applicable
00689: - Company profile
00690: 
00691: Manufacturer-specific documents:
00692: 
00693: - Capacity report where available
00694: - Industrial registry where applicable
00695: - Facility information
00696: - Machinery or production-line summary
00697: - Production photos
00698: - Quality management certificates where claimed
00699: 
00700: ### 12.2 Product and claim evidence
00701: 
00702: Claim evidence is required when a supplier asks the platform to present a claim as reviewed.
00703: 
00704: Seeded evidence types:
00705: 
00706: - OEKO-TEX certificate
00707: - GOTS certificate
00708: - GRS or RCS certificate
00709: - ISO 9001 certificate
00710: - Social-compliance audit report
00711: - Composition test report
00712: - Shrinkage and dimensional-stability test
00713: - Colour-fastness test
00714: - Pilling test
00715: - Absorbency test
00716: - Waterproof or liquid-barrier test
00717: - Industrial-laundry durability test
00718: - Flame-resistance test
00719: - Antimicrobial or antiviral claim evidence
00720: - Product technical data sheet
00721: 
00722: Rules can be category-specific and claim-dependent.
00723: 

## Source lines 2037-2179

02037: | A03 | OAuth callback | /auth/callback | AuthLayout, LoadingState, ErrorState, RetryAction | MVP |
02038: | A04 | Email verification pending | /auth/verify-email | AuthLayout, VerificationStatus, ResendControl, ChangeEmailAction | MVP |
02039: | A05 | Email verification result | /auth/verify-email/result | AuthLayout, SuccessState/ErrorState, ContinueAction | MVP |
02040: | A06 | Forgot password | /auth/forgot-password | AuthLayout, EmailForm, SuccessNotice, BackToLogin | MVP |
02041: | A07 | Reset password | /auth/reset-password | AuthLayout, ResetPasswordForm, PasswordStrength, TokenErrorState | MVP |
02042: | A08 | Workspace selection | /onboarding/workspaces | OnboardingLayout, WorkspaceCards, RoleExplanation, ContinueBar | MVP |
02043: | A09 | Business identity setup | /onboarding/business-identity | OnboardingLayout, CompanyEmailForm, DomainExplanation, ManualExceptionForm, DocumentUploader, ContinueBar | MVP |
02044: | A10 | Business identity status | /onboarding/business-identity/status | OnboardingLayout, ReviewStatusCard, Timeline, RejectionReason, ResubmitAction | MVP |
02045: | A11 | Team invitation acceptance | /invite/:token | AuthLayout, InvitationSummary, AccountChoice, AcceptDeclineActions, TokenErrorState | Launch |
02046: | A12 | Restricted or suspended access | /account/restricted | AppNeutralLayout, RestrictionNotice, ReasonPanel, AppealOrContactAction, LegalLinks | Launch |
02047: 
02048: 
02049: ### 37.3 Buyer workspace screens
02050: 
02051: | ID | Screen | Route / instance | Required component assembly | Phase |
02052: |---|---|---|---|---|
02053: | B01 | Buyer overview | /buyer | BuyerShell, DashboardHeader, VerificationBanner, RFQSummaryCards, ResponseFeed, MessagePreview, SavedItemsPreview | MVP |
02054: | B02 | RFQ and project list | /buyer/rfqs | BuyerShell, PageHeader, StatusTabs, SearchBar, RFQTable/CardList, Pagination, EmptyState | MVP |
02055: | B03 | RFQ type and package selection | /buyer/rfqs/new | BuyerShell, FormStepper, RFQTypeCards, PackageTemplateGrid, ContinueBar | MVP |
02056: | B04 | RFQ basics | /buyer/rfqs/new/basics | BuyerShell, FormStepper, TextFields, ContextSelector, DeliveryFields, DateChoice, AutosaveIndicator | MVP |
02057: | B05 | RFQ line items | /buyer/rfqs/new/items | BuyerShell, FormStepper, LineItemEditor, CategoryPicker, QuantityUnitField, DynamicParameterFields, DuplicateRemoveActions, AddItemButton | MVP |
02058: | B06 | RFQ requirements and attachments | /buyer/rfqs/new/requirements | BuyerShell, FormStepper, RequirementBuilder, CertificationSelector, CustomizationFields, FileUploader, NotesField | MVP |
02059: | B07 | RFQ preview and publish | /buyer/rfqs/new/review | BuyerShell, FormStepper, RFQSummary, LineItemAccordion, ValidationSummary, PublishControls | MVP |
02060: | B08 | RFQ detail and management | /buyer/rfqs/:id | BuyerShell, RFQHeader, StatusActions, LineItemTable, RequirementGroups, ResponseSummary, ConversationPreview, CloseExtendActions | MVP |
02061: | B09 | Supplier responses list | /buyer/responses | BuyerShell, PageHeader, FilterBar, ResponseCard/Table, StatusBadge, Pagination, EmptyState | MVP |
02062: | B10 | Response comparison | /buyer/rfqs/:id/compare | BuyerShell, ComparisonHeader, SupplierColumns, LineCoverageMatrix, SpecificationComparison, AttachmentLinks, ShortlistControls | Launch |
02063: | B11 | Response detail | /buyer/responses/:id | BuyerShell, ResponseHeader, SupplierSummary, ResponseLineTable, AlternativeSpecNotice, Attachments, StartConversationCTA | MVP |
02064: | B12 | Conversations list | /buyer/messages | BuyerShell, ConversationList, SearchBar, ContextFilters, UnreadBadge, EmptyState | MVP |
02065: | B13 | Conversation detail | /buyer/messages/:id | BuyerShell, ConversationHeader, ContextSummary, MessageThread, AttachmentList, ContactRevealPanel, MessageComposer | MVP |
02066: | B14 | Saved products | /buyer/saved/products | BuyerShell, PageHeader, ProductGrid, CollectionControls, RemoveSavedAction, EmptyState | Launch |
02067: | B15 | Saved suppliers | /buyer/saved/suppliers | BuyerShell, PageHeader, SupplierGrid, NotesControl, RemoveSavedAction, EmptyState | Launch |
02068: | B16 | Buyer company profile | /buyer/company | BuyerShell, PageHeader, CompanyProfileForm, BusinessIdentityStatus, AddressFields, SaveBar | MVP |
02069: | B17 | Contact and privacy | /buyer/settings/privacy | BuyerShell, SettingsNav, ContactVisibilityForm, ConsentControls, DataExport/DeleteActions | Launch |
02070: | B18 | Notification settings | /buyer/settings/notifications | BuyerShell, SettingsNav, NotificationMatrix, FrequencySelectors, SaveBar | Launch |
02071: 
02072: 
02073: ### 37.4 Supplier workspace screens
02074: 
02075: | ID | Screen | Route / instance | Required component assembly | Phase |
02076: |---|---|---|---|---|
02077: | S01 | Supplier overview | /supplier | SupplierShell, ActivationBanner, OnboardingProgress, ProductSummary, MatchedRFQFeed, EnquiryFeed, DocumentExpiryPanel | MVP |
02078: | S02 | Supplier onboarding checklist | /supplier/onboarding | SupplierShell, OnboardingStepper, ChecklistCards, BlockingIssuePanel, ContinueActions | MVP |
02079: | S03 | Company profile | /supplier/company | SupplierShell, PageHeader, CompanyProfileForm, MediaUploader, ExportMarketsSelector, SaveBar | MVP |
02080: | S04 | Supplier types and capabilities | /supplier/capabilities | SupplierShell, CapabilitySelector, SupplierTypeCards, ApplicationContextSelector, ProductionCapabilityForm, SaveBar | MVP |
02081: | S05 | Company documents | /supplier/documents/company | SupplierShell, PageHeader, RequirementSummary, DocumentStatusList, ExpiryBadges, UploadActions | MVP |
02082: | S06 | Company document upload | /supplier/documents/company/new | SupplierShell, DocumentTypeSelector, FileUploader, MetadataForm, SensitivityNotice, SubmitBar | MVP |
02083: | S07 | Company document status detail | /supplier/documents/company/:id | SupplierShell, DocumentViewer, ReviewTimeline, RejectionReason, ReplacementUploader, PublicVisibilityToggle | MVP |
02084: | S08 | Products list | /supplier/products | SupplierShell, PageHeader, ProductStatusTabs, SearchFilterBar, ProductManagementTable, BulkActions, Pagination | MVP |
02085: | S09 | Product wizard — basics | /supplier/products/new/basics | SupplierShell, FormStepper, CoreProductFields, SourceLanguageSelector, DraftAutosave, ContinueBar | MVP |
02086: | S10 | Product wizard — category and contexts | /supplier/products/new/classification | SupplierShell, FormStepper, CategoryTreePicker, ApplicationContextSelector, ResolvedSchemaSummary, ContinueBar | MVP |
02087: | S11 | Product wizard — technical specifications | /supplier/products/new/specifications | SupplierShell, FormStepper, DynamicParameterForm, CompositionEditor, DimensionFields, ValidationSummary | MVP |
02088: | S12 | Product wizard — variants | /supplier/products/new/variants | SupplierShell, FormStepper, VariantAxisSelector, VariantMatrix, BulkEditControls, ContinueBar | Launch |
02089: | S13 | Product wizard — media and files | /supplier/products/new/media | SupplierShell, FormStepper, ImageUploader, ReorderableGallery, TechnicalFileUploader, MediaValidation | MVP |
02090: | S14 | Product wizard — commercial information | /supplier/products/new/commercial | SupplierShell, FormStepper, MOQFields, LeadTimeFields, CapacityFields, IncotermSelector, PackagingFields | MVP |
02091: | S15 | Product wizard — localization | /supplier/products/new/localization | SupplierShell, FormStepper, LocaleTabs, TranslationFields, FallbackPreview, ContinueBar | MVP |
02092: | S16 | Product preview and publish | /supplier/products/new/review | SupplierShell, FormStepper, PublicProductPreview, ValidationSummary, ClaimWarnings, PublishControls | MVP |
02093: | S17 | Product management detail | /supplier/products/:id | SupplierShell, ProductAdminHeader, StatusActions, ProductPreview, CompletionIssues, EvidencePanel, EditSectionLinks | MVP |
02094: | S18 | Matched RFQs list | /supplier/rfqs | SupplierShell, PageHeader, MatchFilters, MatchedRFQCards, MatchReasonChips, Pagination | MVP |
02095: | S19 | Matched RFQ detail | /supplier/rfqs/:id | SupplierShell, RFQHeader, MatchExplanation, LineItemTable, RequirementGroups, BuyerVisibilityNotice, RespondCTA | MVP |
02096: | S20 | RFQ response composer | /supplier/rfqs/:id/respond | SupplierShell, ResponseStepper, LineCoverageSelector, ResponseLineEditor, AlternativeSpecFields, AttachmentUploader, ReviewSubmitBar | MVP |
02097: | S21 | My responses | /supplier/responses | SupplierShell, PageHeader, StatusTabs, ResponseTable, FollowUpIndicators, Pagination | MVP |
02098: | S22 | Direct enquiries | /supplier/enquiries | SupplierShell, PageHeader, EnquiryList, ProductContextChip, BuyerIdentityState, OpenConversationAction | MVP |
02099: | S23 | Conversations list | /supplier/messages | SupplierShell, ConversationList, SearchBar, ContextFilters, UnreadBadge, EmptyState | MVP |
02100: | S24 | Conversation detail | /supplier/messages/:id | SupplierShell, ConversationHeader, ContextSummary, MessageThread, AttachmentList, ContactRevealPanel, MessageComposer | MVP |
02101: | S25 | Product evidence and claims | /supplier/evidence | SupplierShell, PageHeader, ClaimFilterBar, EvidenceStatusTable, UploadLinkActions, ExpiryWarnings | Launch |
02102: | S26 | Team management | /supplier/team | SupplierShell, PageHeader, TeamTable, InviteMemberModal, RoleSelector, RemoveMemberDialog | Launch |
02103: | S27 | Supplier settings | /supplier/settings | SupplierShell, SettingsTabs, ContactVisibilityForm, NotificationMatrix, ConsentControls, SaveBar | Launch |
02104: 
02105: 
02106: ### 37.5 Admin and moderator screens
02107: 
02108: | ID | Screen | Route / instance | Required component assembly | Phase |
02109: |---|---|---|---|---|
02110: | D01 | Operations overview | /admin | AdminShell, QueueSummary, RiskAlerts, ReviewWorkload, RecentAuditFeed, QuickActions | MVP |
02111: | D02 | Category tree | /admin/catalogue/categories | AdminShell, TreeEditor, NodeSearch, VersionSelector, DraftPublishedBadge, CreateNodeAction | MVP |
02112: | D03 | Category editor | /admin/catalogue/categories/:id | AdminShell, NodeEditorForm, TranslationTabs, SEOFields, StatusControls, ArchiveDialog | MVP |
02113: | D04 | Product templates | /admin/catalogue/templates | AdminShell, DataTable, CategoryFilter, VersionBadge, CreateTemplateAction, Pagination | MVP |
02114: | D05 | Product template editor | /admin/catalogue/templates/:id | AdminShell, SchemaRuleEditor, FieldOrdering, RequirementControls, ValidationRules, VersionActions | MVP |
02115: | D06 | Application overlays | /admin/catalogue/overlays | AdminShell, ContextTabs, OverlayTable, StatusFilters, CreateOverlayAction | MVP |
02116: | D07 | Application overlay editor | /admin/catalogue/overlays/:id | AdminShell, SchemaRuleEditor, ContextScopeHeader, OverrideControls, VersionActions | MVP |
02117: | D08 | Parameter definitions | /admin/catalogue/parameters | AdminShell, DataTable, TypeFilters, SearchBar, ArchiveStatus, CreateParameterAction | MVP |
02118: | D09 | Parameter editor | /admin/catalogue/parameters/:id | AdminShell, ParameterForm, TranslationTabs, DataTypeConfig, UnitOptionConfig, VisibilityControls | MVP |
02119: | D10 | Units and measurement families | /admin/catalogue/units | AdminShell, MeasurementFamilyTabs, UnitTable, UnitEditorDrawer, ArchiveDialog | Launch |
02120: | D11 | Option sets | /admin/catalogue/options | AdminShell, OptionSetList, OptionValueTable, TranslationEditor, ReorderControls, ArchiveDialog | MVP |
02121: | D12 | Filter and RFQ schemas | /admin/catalogue/schemas | AdminShell, SchemaTabs, FieldUsageMatrix, OrderingControls, MatchingModeControls, SaveVersionBar | Launch |
02122: | D13 | Resolved schema preview | /admin/catalogue/preview | AdminShell, ContextCategorySelectors, ResolvedSchemaPreview, ProductFormPreview, RFQFormPreview, RuleTrace | MVP |
02123: | D14 | Schema impact analysis | /admin/catalogue/impact/:version | AdminShell, ImpactSummaryCards, AffectedEntityTables, MigrationWarnings, ExportReportAction, PublishBlockers | Launch |
02124: | D15 | Supplier companies | /admin/suppliers | AdminShell, SearchFilterBar, SupplierTable, ActivationStateBadge, BulkActions, Pagination | MVP |
02125: | D16 | Supplier detail | /admin/suppliers/:id | AdminShell, SupplierAdminHeader, CompanyProfileSummary, DocumentSummary, ProductsTab, RFQsTab, SuspensionControls, AuditTimeline | MVP |
02126: | D17 | Company-document review queue | /admin/reviews/company-documents | AdminShell, ReviewQueue, AssignmentFilter, SLAIndicator, DocumentTypeFilter, Pagination | MVP |
02127: | D18 | Company-document review | /admin/reviews/company-documents/:id | AdminShell, SecureDocumentViewer, SupplierContextPanel, RequirementChecklist, ReviewDecisionForm, AuditPreview | MVP |
02128: | D19 | Claim-evidence review queue | /admin/reviews/evidence | AdminShell, ReviewQueue, ClaimRiskFilters, ExpiryFilter, AssignmentControls, Pagination | Launch |
02129: | D20 | Claim-evidence review | /admin/reviews/evidence/:id | AdminShell, SecureDocumentViewer, ProductClaimContext, SourceCheckForm, ReviewDecisionForm, PublicLabelPreview | Launch |
02130: | D21 | Expiry and replacement queue | /admin/reviews/expiry | AdminShell, ExpiryTimeline, DocumentTable, SupplierFilters, ReminderActions, BulkActions | Launch |
02131: | D22 | Product moderation queue | /admin/moderation/products | AdminShell, ModerationFilters, ProductTable, ClaimWarningBadge, BulkActions, Pagination | MVP |
02132: | D23 | Product moderation detail | /admin/moderation/products/:id | AdminShell, PublicProductPreview, ModerationIssuePanel, CategoryCorrection, ClaimControls, HideRestoreActions, AuditReasonForm | MVP |
02133: | D24 | RFQ moderation queue | /admin/moderation/rfqs | AdminShell, ModerationFilters, RFQTable, RiskFlags, BulkActions, Pagination | Launch |
02134: | D25 | RFQ moderation detail | /admin/moderation/rfqs/:id | AdminShell, RFQPreview, LineItemReview, AttachmentReview, DecisionForm, AuditReasonForm | Launch |
02135: | D26 | Users, abuse cases and reports | /admin/operations/cases | AdminShell, CaseTabs, UserSearch, ReportQueue, ConversationContextViewer, EnforcementActions, AuditReasonForm | Launch |
02136: | D27 | CMS homepage and static pages | /admin/content/pages | AdminShell, ContentPageList, CMSBlockEditor, PreviewPane, LocaleTabs, PublishControls | Launch |
02137: | D28 | Collections, menus and footer | /admin/content/navigation | AdminShell, ContentTabs, CollectionEditor, MenuTreeEditor, FooterEditor, ReorderControls, PreviewPane | Launch |
02138: | D29 | Localization, SEO and email templates | /admin/content/settings | AdminShell, SettingsTabs, TranslationKeyTable, SEOEditor, EmailTemplateEditor, PreviewSendAction | Launch |
02139: | D30 | Legal documents and privacy requests | /admin/governance | AdminShell, GovernanceTabs, LegalVersionPanel, AcceptanceScopeForm, PrivacyRequestQueue, DeadlineIndicator, DecisionLog | Launch |
02140: | D31 | Support and funding settings | /admin/settings/support | AdminShell, SupportSettingsForm, ExternalProviderURLField, DisclosureCopyEditor, UseOfFundsEditor, CTAPlacementToggles, LinkAnalyticsSummary, PreviewPane | MVP |
02141: | D32 | Audit logs and global settings | /admin/settings/system | AdminShell, SettingsTabs, AuditLogTable, AuditDetailDrawer, DomainRules, NotificationRules, SecuritySettings, ExportControls | Launch |
02142: 
02143: 
02144: ### 37.6 Shared system and exception screens
02145: 
02146: | ID | Screen | Route / instance | Required component assembly | Phase |
02147: |---|---|---|---|---|
02148: | X01 | Not found | /404 | NeutralLayout, ErrorIllustration, SuggestedLinks, SearchBar | MVP |
02149: | X02 | Unexpected error | /500 | NeutralLayout, ErrorReference, RetryAction, SupportLink | MVP |
02150: | X03 | Offline / connection lost | /offline | NeutralLayout, OfflineNotice, RetryAction, CachedNavigation | Launch |
02151: | X04 | Permission denied | /403 | NeutralLayout, PermissionNotice, CurrentRoleSummary, BackAction, SupportLink | MVP |
02152: | X05 | Maintenance | /maintenance | NeutralLayout, MaintenanceNotice, StatusMessage, RetryAction | Launch |
02153: | X06 | Generic empty and first-use states | Component state, not public route | EmptyState, SuggestedPrimaryAction, LearnMoreLink, OptionalIllustration | MVP |
02154: 
02155: 
02156: 
02157: ## 38. Required states and responsive behaviour
02158: 
02159: Every list, detail and form screen must define:
02160: 
02161: - Loading state
02162: - Empty state
02163: - Recoverable error state
02164: - Permission-denied state
02165: - Disabled or read-only state
02166: - Success feedback
02167: - Validation feedback
02168: - Mobile and desktop layouts
02169: 
02170: ### 38.1 Responsive rules
02171: 
02172: - Public discovery pages use an editorial desktop grid and collapse to one-column reading order on small screens.
02173: - Filter sidebars become drawers on tablet and mobile.
02174: - Data tables expose a mobile card representation or horizontal scroll only when a card representation would lose critical comparison meaning.
02175: - Multi-line RFQ and response editors preserve line-item context on mobile.
02176: - Dashboard sidebars collapse to an accessible drawer.
02177: - Sticky actions must not cover validation errors, cookie controls or system navigation.
02178: 
02179: ### 38.2 Accessibility rules
