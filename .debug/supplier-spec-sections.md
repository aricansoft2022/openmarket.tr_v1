# Extracted Supplier taxonomy source

Generated from the SHA-verified `spec.full.md`; temporary audit evidence only.

## Source lines 1-70

00001: # OpenMarket.tr — Home & Contract Textiles Product and Technical Specification
00002: 
00003: **Status:** Source of truth  
00004: **Version:** 2.1  
00005: **Supersedes:** Version 1.0 eight-sector specification  
00006: **Business model:** Free, open-access and donation-supported B2B directory and RFQ platform  
00007: **Launch vertical:** Home, hotel, hospital and dormitory textiles  
00008: **Primary supplier market:** Türkiye  
00009: **Primary buyer market:** International and domestic professional buyers  
00010: **Visual direction:** Red editorial / catalogue-led B2B directory
00011: 
00012: ## 1. Project definition
00013: 
00014: OpenMarket.tr is a focused B2B product, supplier and buying-request platform for textile products used in:
00015: 
00016: 1. Homes and retail home-textile collections
00017: 2. Hotels, resorts, spas and other hospitality facilities
00018: 3. Hospitals, clinics and non-sterile healthcare accommodation
00019: 4. Dormitories, residences, hostels and institutional accommodation
00020: 
00021: The platform connects professional buyers with manufacturers, exporters and authorized suppliers based in Türkiye.
00022: 
00023: It provides:
00024: 
00025: - Structured textile product and supplier discovery
00026: - A single product taxonomy with application-specific data overlays
00027: - Single-product and multi-line project RFQs
00028: - Supplier responses and context-bound conversations
00029: - Supplier company-document and product-claim review
00030: - Textile-specific product forms, filters and matching
00031: - Multilingual catalogue, CMS, SEO, legal and moderation tools
00032: 
00033: OpenMarket does not process commercial payments. Quotations, samples, contracts, payments, shipping, customs, installation and fulfilment remain between buyer and supplier.
00034: 
00035: ## 2. Product positioning
00036: 
00037: OpenMarket is not a general marketplace and not a generic multi-sector directory.
00038: 
00039: Its product promise is:
00040: 
00041: > Find Turkish home and contract textile suppliers, compare products using textile-specific data, and send a structured buying request for one item or a complete procurement package.
00042: 
00043: The platform should be useful to:
00044: 
00045: - Importers and distributors
00046: - Retail and private-label buyers
00047: - Hotel, resort and spa procurement teams
00048: - Hospital and clinic procurement teams
00049: - Dormitory, residence and hostel operators
00050: - Interior design, fit-out and project procurement companies
00051: - Wholesalers and buying offices
00052: 
00053: Consumer retail shopping is not supported.
00054: 
00055: ## 3. Scope-reduction decisions
00056: 
00057: Version 2.0 deliberately removes general-purpose complexity from the original platform definition.
00058: 
00059: ### 3.1 One vertical, not multiple sectors
00060: 
00061: There is one commercial vertical: **Home & Contract Textiles**.
00062: 
00063: Home, hotel, hospital and dormitory are modelled as **application contexts**, not duplicated sector trees.
00064: 
00065: A product can support one or more application contexts.
00066: 
00067: ### 3.2 One category tree
00068: 
00069: The platform uses a single textile product category tree. Category definitions are shared across application contexts.
00070: 

## Source lines 108-197

00108: 10. A supplier needs a verified company email, minimum company profile and approved company documents before commercial activation.
00109: 11. Complete products from active suppliers publish automatically after validation; moderation occurs after publication.
00110: 12. High-risk or regulated-sounding claims cannot be publicly presented as reviewed without approved evidence.
00111: 13. One account can have both Buyer and Supplier workspaces.
00112: 14. Product categories, product templates, application overlays, document rules, filters and RFQ fields are database-driven.
00113: 15. Other industrial sectors cannot be created or exposed in the launch product.
00114: 
00115: ## 5. Commercial scope
00116: 
00117: ### 5.1 Included product model
00118: 
00119: The platform covers finished, semi-finished and made-to-order textile products intended for home or institutional accommodation use.
00120: 
00121: Included products must be suitable for catalogue listing, project procurement or private-label ordering.
00122: 
00123: ### 5.2 Application contexts
00124: 
00125: Each product and RFQ can be assigned to one or more of these contexts:
00126: 
00127: - **Home & Retail**
00128: - **Hotel & Hospitality**
00129: - **Hospital & Healthcare Accommodation**
00130: - **Dormitory & Institutional Accommodation**
00131: 
00132: Application contexts affect:
00133: 
00134: - Product form fields
00135: - Filters
00136: - RFQ questions
00137: - Matching rules
00138: - Required or claim-dependent documents
00139: - Public explanatory content
00140: 
00141: Application contexts do not create duplicate product records.
00142: 
00143: ### 5.3 Supplier types
00144: 
00145: Supported supplier types:
00146: 
00147: - Manufacturer
00148: - Manufacturer-exporter
00149: - Exporter or trading company
00150: - Authorized distributor
00151: - Contract textile project supplier
00152: - Private-label supplier
00153: 
00154: A supplier can have more than one type.
00155: 
00156: ## 6. Seeded product taxonomy
00157: 
00158: The root taxonomy is **Home & Contract Textiles**.
00159: 
00160: ### 6.1 Bed linen
00161: 
00162: - Flat sheets
00163: - Fitted sheets
00164: - Duvet covers
00165: - Pillowcases
00166: - Pillow shams
00167: - Bed linen sets
00168: - Bedspreads and coverlets
00169: - Blankets and throws
00170: - Quilts and duvets
00171: - Pillows
00172: - Mattress toppers
00173: - Mattress protectors
00174: - Waterproof mattress protectors
00175: - Pillow protectors
00176: - Bed runners
00177: 
00178: ### 6.2 Bath, spa and wellness textiles
00179: 
00180: - Bath towels
00181: - Hand towels
00182: - Face towels
00183: - Guest towels
00184: - Pool and beach towels
00185: - Spa and hammam towels
00186: - Bathrobes
00187: - Bath mats
00188: - Washcloths
00189: - Sauna and spa textile sets
00190: 
00191: ### 6.3 Table and kitchen textiles
00192: 
00193: - Tablecloths
00194: - Table runners
00195: - Cloth napkins
00196: - Placemats
00197: - Kitchen towels

## Source lines 354-438

00354: - Packaging count
00355: - Production capacity
00356: - Temperature
00357: - Time
00358: - Percentage
00359: 
00360: ### 8.3 Seeded units
00361: 
00362: - mm, cm, m, inch
00363: - g, kg, tonne
00364: - GSM and g/m²
00365: - denier and tex
00366: - thread count
00367: - pcs, set, pair, roll
00368: - carton, bale and pallet
00369: - units per day, week or month
00370: - °C
00371: - day and week
00372: - percent
00373: 
00374: ### 8.4 Seeded option sets
00375: 
00376: - Textile fibres and materials
00377: - Weave types
00378: - Knit types
00379: - Yarn types
00380: - Filling materials
00381: - Finishing processes
00382: - Dyeing and printing methods
00383: - Embroidery and logo methods
00384: - Closure types
00385: - Edge and hem types
00386: - Colour families
00387: - Care and washing methods
00388: - Packaging types
00389: - Supplier types
00390: - Application contexts
00391: - Certifications and audit types
00392: - Incoterms
00393: - Currencies
00394: - Countries and export regions
00395: 
00396: Deactivation never deletes historical option values.
00397: 
00398: ## 9. Category templates and application overlays
00399: 
00400: The resolved product schema is produced from:
00401: 
00402: ```text
00403: Global textile fields
00404: → Category ancestor rules
00405: → Leaf-category template
00406: → Application-context overlays
00407: → Claim-dependent rules
00408: ```
00409: 
00410: The most specific explicit rule wins.
00411: 
00412: A rule can:
00413: 
00414: - Inherit
00415: - Override
00416: - Exclude
00417: - Add locally
00418: 
00419: An override can change:
00420: 
00421: - Required, optional or hidden state
00422: - Allowed units or options
00423: - Validation range
00424: - Display order
00425: - Filter visibility
00426: - RFQ visibility
00427: - Matching behaviour
00428: - Help text
00429: 
00430: ### 9.1 Home & Retail overlay
00431: 
00432: Typical additional fields:
00433: 
00434: - Retail collection name
00435: - Retail packaging
00436: - Barcode readiness
00437: - Private-label packaging
00438: - Colourway count

## Source lines 589-740

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
00724: ### 12.3 Evidence states
00725: 
00726: Internal states:
00727: 
00728: - Missing
00729: - Uploaded
00730: - Pending review
00731: - Approved
00732: - Rejected
00733: - Expired
00734: - Replacement required
00735: 
00736: Public labels:
00737: 
00738: - **Supplier declared**
00739: - **Document reviewed**
00740: - **Source checked**

## Source lines 891-1060

00891: - Expired
00892: - Under review
00893: - Change requested
00894: - Rejected
00895: - Removed
00896: 
00897: ### 15.6 Supplier response
00898: 
00899: A supplier response can:
00900: 
00901: - Cover the entire RFQ
00902: - Cover selected line items
00903: - Propose an alternative specification
00904: - Indicate sample availability
00905: - Add lead time
00906: - Attach quotation or technical files
00907: - Start a context-bound conversation
00908: 
00909: The platform does not calculate totals, process payment or create a binding contract.
00910: 
00911: ## 16. Matching
00912: 
00913: Matching is RFQ-specific and never creates a general supplier score.
00914: 
00915: ### 16.1 Hard requirements
00916: 
00917: Possible hard requirements:
00918: 
00919: - Product category
00920: - Application context
00921: - Required dimensions
00922: - Required customization
00923: - Required claim or evidence
00924: - MOQ compatibility
00925: - Delivery-country serviceability
00926: - Supplier type
00927: 
00928: ### 16.2 Soft preferences
00929: 
00930: Possible soft preferences:
00931: 
00932: - Composition
00933: - GSM or thread count
00934: - Colour
00935: - Lead time
00936: - Incoterm
00937: - Export region
00938: - Private-label experience
00939: 
00940: ### 16.3 Informational fields
00941: 
00942: Informational fields do not affect match eligibility.
00943: 
00944: Matched RFQs appear in supplier dashboards and can trigger in-app or email notifications according to:
00945: 
00946: - Immediate
00947: - Daily summary
00948: - Weekly summary
00949: - Off
00950: 
00951: Supplier matching must explain which hard requirements matched or failed.
00952: 
00953: ## 17. Messaging and contact reveal
00954: 
00955: There is no open social messaging.
00956: 
00957: Conversations start only from:
00958: 
00959: - Direct supplier enquiry
00960: - Product enquiry
00961: - Supplier RFQ response
00962: 
00963: Every conversation remains linked to its commercial context.
00964: 
00965: Login email and business contact data are separate.
00966: 
00967: Per-field visibility:
00968: 
00969: - Public
00970: - Reveal after interaction
00971: - Private
00972: 
00973: Supported fields:
00974: 
00975: - Business email
00976: - Phone
00977: - WhatsApp
00978: - LinkedIn
00979: - Website
00980: - Contact person
00981: 
00982: Login email is never automatically exposed.
00983: 
00984: Contact reveal events are recorded.
00985: 
00986: ## 18. Search, filters and ranking
00987: 
00988: Search covers:
00989: 
00990: - Products
00991: - Suppliers
00992: - Product categories
00993: - Application contexts
00994: - Public RFQs where enabled
00995: 
00996: Core filters:
00997: 
00998: - Application context
00999: - Category
01000: - Material composition
01001: - Dimensions
01002: - GSM
01003: - Thread count
01004: - Weave or knit
01005: - Colour family
01006: - MOQ
01007: - Custom size
01008: - Private label
01009: - Logo or embroidery
01010: - Claimed or reviewed certification
01011: - Supplier type
01012: - Country or region served
01013: - Lead time
01014: 
01015: Ranking uses only:
01016: 
01017: - Text relevance
01018: - Selected category
01019: - Application context
01020: - Explicit filters
01021: - Chronology when selected
01022: 
01023: There is no paid ranking and no hidden supplier-quality or profile-completion score.
01024: 
01025: Featured products use admin curation or controlled random selection. New products are chronological.
01026: 
01027: ## 19. Dashboards
01028: 
01029: ### 19.1 Buyer dashboard
01030: 
01031: - Overview
01032: - Procurement Projects and RFQs
01033: - Supplier Responses
01034: - Messages
01035: - Saved Products
01036: - Saved Suppliers
01037: - Company Profile
01038: - Contact and Privacy
01039: - Notification Settings
01040: 
01041: ### 19.2 Supplier dashboard
01042: 
01043: Supplier-facing UI defaults to Turkish:
01044: 
01045: - Genel Bakış
01046: - Şirket Profili
01047: - Ürünler
01048: - Uygun Alım Talepleri
01049: - Tekliflerim
01050: - Doğrudan Talepler
01051: - Mesajlar
01052: - Şirket Belgeleri
01053: - Ürün Belgeleri ve İddialar
01054: - Ekip
01055: - İletişim ve Gizlilik
01056: - Bildirim Ayarları
01057: 
01058: ### 19.3 Admin and moderator dashboard
01059: 
01060: **Catalogue and Product Data**

## Source lines 1468-1552

01468: - SEORecord
01469: - LegalDocument
01470: - LegalDocumentVersion
01471: - LegalAcceptance
01472: - ConsentRecord
01473: - CookieDefinition
01474: - PrivacyRequest
01475: - RetentionPolicy
01476: - Role
01477: - Permission
01478: - AuditLog
01479: - SchemaMigrationPreview
01480: - SupportConfiguration
01481: - SupportLinkEvent
01482: 
01483: ## 28. Critical user flows
01484: 
01485: ### 28.1 Visitor to active buyer
01486: 
01487: 1. Browse products and suppliers.
01488: 2. Register with email/password or Google.
01489: 3. Verify account.
01490: 4. Verify business identity.
01491: 5. Buyer workspace activates.
01492: 6. Create a single-product or multi-line RFQ.
01493: 7. Matching suppliers receive notifications.
01494: 8. Suppliers respond to all or selected line items.
01495: 9. Context conversation begins.
01496: 10. Contact details reveal according to settings.
01497: 
01498: ### 28.2 Visitor to active supplier
01499: 
01500: 1. Register and verify account.
01501: 2. Create Supplier workspace.
01502: 3. Verify company email or business identity.
01503: 4. Complete minimum company profile and supplier types.
01504: 5. Upload mandatory company documents.
01505: 6. Compliance reviewer approves company documents.
01506: 7. Supplier activates.
01507: 8. Complete product drafts publish automatically.
01508: 9. Supplier optionally uploads product-claim evidence.
01509: 10. Reviewed evidence labels appear after approval.
01510: 11. Matched RFQs and enquiries arrive.
01511: 
01512: ### 28.3 Buyer creates a hotel package RFQ
01513: 
01514: 1. Select Hotel & Hospitality.
01515: 2. Choose the hotel guest-room package template.
01516: 3. Add bed linen, towels, bathrobes and curtains as line items.
01517: 4. Enter quantities, dimensions and target delivery.
01518: 5. Add optional wash-performance, logo and packaging requirements.
01519: 6. Publish the RFQ.
01520: 7. Suppliers are matched by category and hard requirements.
01521: 8. A supplier responds to the full package or selected line items.
01522: 
01523: ### 28.4 Admin changes a product template
01524: 
01525: 1. Edit a category template or application overlay.
01526: 2. Preview resolved product and RFQ forms.
01527: 3. Review affected products and RFQ line items.
01528: 4. Resolve migration warnings.
01529: 5. Publish the new version.
01530: 6. Create an audit record.
01531: 
01532: ## 29. Permission matrix
01533: 
01534: Legend: ✓ allowed, — denied, C conditional by state or role.
01535: 
01536: | Capability | Visitor | Registered | Active Buyer | Supplier Pending | Active Supplier | Moderator | Platform Admin | Super Admin |
01537: |---|---:|---:|---:|---:|---:|---:|---:|---:|
01538: | Browse public catalogue | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
01539: | Save products and suppliers | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
01540: | Create Buyer workspace | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
01541: | Create Supplier workspace | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
01542: | Publish RFQ | — | — | ✓ | C if active buyer | C if active buyer | C | ✓ | ✓ |
01543: | Send direct enquiry | — | — | ✓ | C if active buyer | C if active buyer | C | ✓ | ✓ |
01544: | Create product draft | — | — | — | ✓ | ✓ | C | ✓ | ✓ |
01545: | Publish product | — | — | — | — | ✓ | C | ✓ | ✓ |
01546: | Upload company documents | — | — | — | ✓ | ✓ | C | ✓ | ✓ |
01547: | Upload claim evidence | — | — | — | ✓ | ✓ | C | ✓ | ✓ |
01548: | Respond to RFQ | — | — | — | — | ✓ | C | ✓ | ✓ |
01549: | Context messaging | — | — | ✓ | — | ✓ | C | ✓ | ✓ |
01550: | Reveal contact data | — | — | ✓ | — | ✓ | C | ✓ | ✓ |
01551: | Review company documents | — | — | — | — | — | C | ✓ | ✓ |
01552: | Review claim evidence | — | — | — | — | — | C | ✓ | ✓ |

## Source lines 2045-2129

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
