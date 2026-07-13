# Supplier company-document source contract

## Source lines 1-222

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
00071: Application-specific requirements are added through overlay rules. For example, a bed sheet remains one product category, while hospital use can add industrial-wash, bleach-resistance or liquid-barrier fields.
00072: 
00073: ### 3.3 Textile-only schema engine
00074: 
00075: The platform retains configurable, typed product fields, but does not launch with a generic cross-industry parameter and unit engine.
00076: 
00077: Only textile, packaging, capacity and commercial measurement families required by the launch scope are seeded.
00078: 
00079: ### 3.4 Company activation and claim verification are separated
00080: 
00081: Supplier activation depends on company identity and minimum supplier documentation.
00082: 
00083: Product certifications and performance claims are reviewed separately. A supplier does not remain blocked because an optional claim document is still pending.
00084: 
00085: ### 3.5 Multi-line RFQs are core
00086: 
00087: Hotel, hospital and dormitory purchasing frequently covers a package of products. An RFQ can therefore contain one or many line items.
00088: 
00089: ### 3.6 Fixed launch roles
00090: 
00091: The launch uses a small set of fixed operational roles. Arbitrary custom roles, complex delegation and sector-subtree permission design are deferred.
00092: 
00093: ### 3.7 Bilingual launch
00094: 
00095: The launch UI supports Turkish and English. Additional public languages can be added later without redesigning the data model.
00096: 
00097: ## 4. Non-negotiable rules
00098: 
00099: 1. Buyers and suppliers use the platform free of charge.
00100: 2. Suppliers have no product-count limit.
00101: 3. RFQs, RFQ responses and direct enquiries are free.
00102: 4. There are no paid tiers, credits, commissions or paid ranking.
00103: 5. There is no supplier score, hidden quality score or profile-completion ranking.
00104: 6. The platform is donation-supported. Voluntary support uses a configurable external provider URL and never affects access, eligibility, visibility, moderation, matching or ranking.
00105: 7. OpenMarket does not guarantee supplier reliability, product quality or transaction performance.
00106: 8. Supplier declarations and OpenMarket-reviewed evidence are displayed separately.
00107: 9. A buyer needs a verified business identity before commercial interaction.
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
00198: - Tea towels
00199: - Kitchen aprons
00200: - Chair covers and sashes
00201: - Banquet textile sets
00202: 
00203: ### 6.4 Window and room textiles
00204: 
00205: - Curtains
00206: - Blackout curtains
00207: - Sheer curtains
00208: - Privacy and cubicle curtains
00209: - Curtain fabrics
00210: - Decorative cushion covers
00211: - Decorative cushions
00212: - Upholstery and contract fabrics
00213: - Textile room accessories
00214: 
00215: ### 6.5 Protective and institutional textiles
00216: 
00217: - Reusable underpads
00218: - Absorbent bed pads
00219: - Liquid-resistant bed protectors
00220: - Laundry bags
00221: - Linen transport bags
00222: - Institutional pillow and mattress covers

## Source lines 580-877

00580: 
00581: ## 11. Supplier registration and activation
00582: 
00583: ### 11.1 Registration methods
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
00741: 
00742: The platform never uses a vague “Verified Supplier” or “Certified Product” badge.
00743: 
00744: ### 12.4 High-risk claims
00745: 
00746: The following claims are hidden or blocked from public display until required evidence is approved:
00747: 
00748: - Sterile
00749: - Medical device
00750: - PPE
00751: - Surgical use
00752: - Antimicrobial or antiviral performance
00753: - Flame resistant or flame retardant
00754: - Certified organic
00755: - Certified recycled content
00756: 
00757: Sterile products, medical devices, PPE and surgical textiles remain out of scope even if evidence is uploaded.
00758: 
00759: ### 12.5 Public and private documents
00760: 
00761: Suppliers choose which publicly eligible approved documents appear on profiles or product pages.
00762: 
00763: Sensitive company documents remain private and use expiring authorized URLs with role and ownership checks.
00764: 
00765: ## 13. Products, publication and moderation
00766: 
00767: Suppliers can create unlimited products.
00768: 
00769: Product states:
00770: 
00771: - Draft
00772: - Published
00773: - Hidden by supplier
00774: - Hidden by admin
00775: - Under review
00776: - Archived
00777: - Removed
00778: 
00779: Automatic publication requires:
00780: 
00781: - Active supplier
00782: - Active category
00783: - At least one application context
00784: - Completed required resolved fields
00785: - Valid main image
00786: - No blocked claim
00787: 
00788: No default product pre-approval queue exists.
00789: 
00790: Moderation actions include:
00791: 
00792: - Hide and restore
00793: - Correct category or application context
00794: - Remove unsupported or prohibited claims
00795: - Request evidence
00796: - Handle duplicates and spam
00797: - Suspend publication
00798: - Add internal notes
00799: - Apply bulk actions
00800: 
00801: Supplier declarations can remain visible where allowed, but must be clearly distinguished from reviewed evidence.
00802: 
00803: ## 14. Product localization
00804: 
00805: Launch languages:
00806: 
00807: - Turkish
00808: - English
00809: 
00810: The supplier dashboard defaults to Turkish.
00811: 
00812: Translatable fields:
00813: 
00814: - Product name
00815: - Short description
00816: - Long description
00817: - Packaging description
00818: - Additional notes
00819: - Company description
00820: 
00821: A product requires content in at least one active language.
00822: 
00823: Fallback order:
00824: 
00825: 1. Selected language
00826: 2. English
00827: 3. Turkish
00828: 4. Source language
00829: 
00830: Missing translations do not affect ranking.
00831: 
00832: The data model must allow additional languages without product-table changes.
00833: 
00834: ## 15. Buyer RFQs and procurement projects
00835: 
00836: ### 15.1 RFQ types
00837: 
00838: - Single-product RFQ
00839: - Multi-line project RFQ
00840: 
00841: ### 15.2 Minimum RFQ fields
00842: 
00843: - RFQ title or short requirement
00844: - Application context
00845: - Delivery country
00846: - At least one line item
00847: - Quantity for each line item or “Not decided yet”
00848: - Target delivery date or “Not decided yet”
00849: 
00850: ### 15.3 RFQ line item
00851: 
00852: Each line item contains:
00853: 
00854: - Product category
00855: - Quantity and unit
00856: - Optional target dimensions
00857: - Optional target composition
00858: - Optional colour or design requirement
00859: - Optional category-specific attributes
00860: - Required certifications or evidence
00861: - Customization requirements
00862: - Packaging requirements
00863: - Notes and attachments
00864: 
00865: ### 15.4 Additional RFQ details
00866: 
00867: Resolved fields appear under “Add more details” unless explicitly required.
00868: 
00869: Common additional fields:
00870: 
00871: - Target GSM or thread count
00872: - Fabric and weave
00873: - Wash-performance requirements
00874: - Waterproof or liquid-barrier requirement
00875: - Flame-resistance requirement
00876: - Logo or embroidery
00877: - Private label

## Source lines 1027-1412

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
01061: 
01062: - Product category tree
01063: - Product templates
01064: - Application-context overlays
01065: - Parameters, units and option sets
01066: - Filters and RFQ schemas
01067: - Schema preview and impact summary
01068: 
01069: **Suppliers and Evidence**
01070: 
01071: - Supplier companies
01072: - Company-document review
01073: - Product-claim evidence review
01074: - Expiry and replacement queues
01075: 
01076: **Marketplace Operations**
01077: 
01078: - Products
01079: - RFQs and responses
01080: - Conversations and reports
01081: - Users and abuse cases
01082: - Notifications
01083: 
01084: **Content and Governance**
01085: 
01086: - Homepage and static pages
01087: - Menus and footer
01088: - Localization
01089: - SEO and social metadata
01090: - Email templates
01091: - Legal documents
01092: - Privacy requests
01093: - Audit logs
01094: 
01095: ## 20. CMS, editorial presentation and SEO
01096: 
01097: Admins can manage:
01098: 
01099: - Homepage section order
01100: - Headlines, descriptions, CTAs and links
01101: - Category and application-context landing pages
01102: - Editorial collections
01103: - Supplier showcases
01104: - Product section counts
01105: - Menus and footer
01106: - Static pages
01107: - Support URL, support-page copy, funding principles and external-provider disclosure
01108: - Translation strings
01109: - Email templates
01110: 
01111: SEO supports:
01112: 
01113: - Global and per-page title and description
01114: - Slug
01115: - Canonical
01116: - noindex and nofollow
01117: - Open Graph title, description and image
01118: - X/Twitter metadata
01119: - Multilingual slugs
01120: - hreflang
01121: 
01122: Dynamic templates exist for:
01123: 
01124: - Product
01125: - Supplier
01126: - Category
01127: - Application context
01128: - RFQ
01129: - Editorial content page
01130: 
01131: Structured data includes:
01132: 
01133: - Organization
01134: - Product
01135: - BreadcrumbList
01136: - WebSite
01137: - SearchAction
01138: 
01139: ## 21. Design specification
01140: 
01141: The selected direction remains red, editorial and catalogue-led, but photography and composition must reflect textiles and procurement rather than general industry.
01142: 
01143: ### 21.1 Editorial discovery
01144: 
01145: Homepage, application landing pages, collections and supplier showcases use:
01146: 
01147: - Large serif headlines
01148: - Red accents
01149: - Black and white foundations
01150: - Textile-detail photography
01151: - Factory, loom, finishing and hospitality imagery
01152: - Magazine-inspired compositions
01153: 
01154: ### 21.2 Directory experience
01155: 
01156: Search, product listings, supplier listings, product details and RFQs use:
01157: 
01158: - Dense readable grids
01159: - Strong filters
01160: - Clear material and specification data
01161: - Minimal decorative cards
01162: - Restrained editorial accents
01163: 
01164: ### 21.3 Operational interfaces
01165: 
01166: Buyer, Supplier, Admin and Moderator dashboards are sans-serif-first, functional and accessible.
01167: 
01168: Never use:
01169: 
01170: - Fake counts
01171: - Fake ratings
01172: - Trust badges without defined evidence
01173: - Testimonials presented as proof
01174: - Paid-placement language
01175: - Generic gradients
01176: - Glassmorphism
01177: - Excessive rounded cards
01178: 
01179: ## 22. Legal, privacy and consent
01180: 
01181: The platform implements privacy by design and data minimization.
01182: 
01183: ### 22.1 Legal content management
01184: 
01185: Authorized admins can create, version, publish, archive and localize:
01186: 
01187: - Terms of Service
01188: - Privacy Notice
01189: - KVKK Aydınlatma Metni
01190: - GDPR Privacy Notice
01191: - Cookie Policy
01192: - Community Guidelines
01193: - Supplier Terms
01194: - Buyer Terms
01195: - Document Review Disclaimer
01196: - Acceptable Use Policy
01197: - Data Retention Notice
01198: - Marketing Consent Text
01199: 
01200: Each version supports:
01201: 
01202: - Language
01203: - Effective date
01204: - Status
01205: - Required acceptance
01206: - User-role applicability
01207: - Country or region applicability
01208: - Changelog
01209: - Archived versions
01210: 
01211: Material changes can require renewed acceptance.
01212: 
01213: ### 22.2 Privacy centre
01214: 
01215: Users can:
01216: 
01217: - View and correct data
01218: - Export data
01219: - Request deletion or restriction
01220: - Manage marketing consent
01221: - Manage cookie preferences
01222: - Review legal acceptances
01223: 
01224: Consent records are separate for:
01225: 
01226: - Terms
01227: - Privacy notice
01228: - Marketing
01229: - Analytics cookies
01230: - Optional public contact disclosure
01231: 
01232: ### 22.3 Cookies
01233: 
01234: Cookie categories:
01235: 
01236: - Strictly necessary
01237: - Preferences
01238: - Analytics
01239: - Marketing
01240: 
01241: Non-essential cookies remain disabled before consent. Reject must be as easy as accept.
01242: 
01243: ## 23. Notifications
01244: 
01245: Buyer events:
01246: 
01247: - Account and business verification
01248: - RFQ publication or change request
01249: - New supplier response
01250: - New message
01251: - RFQ expiry
01252: 
01253: Supplier events:
01254: 
01255: - Account and company-document review
01256: - Activation
01257: - Product publication or moderation
01258: - Claim-evidence approval, rejection or expiry
01259: - Matched RFQ
01260: - Direct enquiry
01261: - New message
01262: 
01263: Admin and moderator events:
01264: 
01265: - Review assignment
01266: - Report or suspicious activity
01267: - Expiring company or claim documents
01268: - Privacy request deadline
01269: - Security alert
01270: 
01271: Templates are multilingual and individually configurable.
01272: 
01273: ## 24. Roles and permissions
01274: 
01275: Launch roles:
01276: 
01277: - Super Admin
01278: - Platform Admin
01279: - Catalogue and Content Editor
01280: - Compliance Reviewer
01281: - Product and RFQ Moderator
01282: - Privacy and Support Manager
01283: 
01284: Permission structure:
01285: 
01286: ```text
01287: Resource + Action
01288: ```
01289: 
01290: Resources include:
01291: 
01292: - Category
01293: - Parameter
01294: - Option set
01295: - Product template
01296: - Application overlay
01297: - Supplier
01298: - Company document
01299: - Claim evidence
01300: - Product
01301: - RFQ
01302: - User
01303: - Report
01304: - Content
01305: - SEO
01306: - Legal document
01307: - Privacy request
01308: - Audit log
01309: 
01310: Actions include:
01311: 
01312: - View
01313: - Create
01314: - Edit
01315: - Approve
01316: - Reject
01317: - Hide
01318: - Suspend
01319: - Archive
01320: - Delete
01321: - Export
01322: 
01323: Fixed role permissions are configured in code or seed data at launch.
01324: 
01325: Custom roles, temporary delegation and arbitrary subtree scopes are out of scope for the first release.
01326: 
01327: ## 25. Audit and schema safety
01328: 
01329: All admin and moderator changes generate immutable audit entries containing:
01330: 
01331: - Actor
01332: - Effective role
01333: - Resource
01334: - Action
01335: - Old value
01336: - New value
01337: - Reason where required
01338: - Timestamp
01339: - IP and session metadata
01340: 
01341: A reason is mandatory for:
01342: 
01343: - Document or evidence rejection
01344: - Source-check outcome
01345: - Supplier suspension
01346: - Product or RFQ removal
01347: - Public claim removal
01348: - Product-template changes affecting required fields
01349: - Legal publication
01350: - Permanent deletion
01351: 
01352: Before publishing product-template or overlay changes, the system shows an impact summary:
01353: 
01354: - Affected products
01355: - Affected RFQ line items
01356: - Newly missing required fields
01357: - Invalid option values
01358: - Products containing archived values
01359: - Evidence gaps caused by new claim rules
01360: 
01361: Deletion defaults to deactivation or archive. Data-type changes require a migration preview.
01362: 
01363: ## 26. Technical architecture
01364: 
01365: The system requires:
01366: 
01367: - Relational database
01368: - Versioned category and template schemas
01369: - Typed dynamic product attributes
01370: - Application-context overlays
01371: - Efficient filtering
01372: - Private object storage
01373: - Search indexing
01374: - Multilingual content
01375: - Background jobs
01376: - Immutable audit logs
01377: - Privacy workflows
01378: - Schema migration previews
01379: 
01380: Use a hybrid relational model:
01381: 
01382: - Fixed core entities
01383: - Typed dynamic attribute tables
01384: - Translation tables
01385: - Versioned template and rule tables
01386: 
01387: Do not put all product attributes into an unvalidated JSON blob.
01388: 
01389: ### 26.1 Simplified schema principle
01390: 
01391: The platform does not need:
01392: 
01393: - A sector tree
01394: - Cross-industry measurement families
01395: - Eight sector-specific parameter packages
01396: - Sector-scoped roles
01397: - General-purpose industrial compliance rules
01398: 
01399: It needs:
01400: 
01401: - One category tree
01402: - Four application contexts
01403: - Category templates
01404: - Application overlays
01405: - Claim-dependent evidence rules
01406: 
01407: ## 27. Suggested entities
01408: 
01409: Core identity and company:
01410: 
01411: - User
01412: - AuthIdentity

## Source lines 1430-1899

01430: - ApplicationParameterRule
01431: - ClaimRule
01432: 
01433: Products:
01434: 
01435: - Product
01436: - ProductTranslation
01437: - ProductApplication
01438: - ProductVariant
01439: - ProductAttributeValue
01440: - ProductMedia
01441: 
01442: Documents and evidence:
01443: 
01444: - DocumentType
01445: - CompanyDocumentRequirement
01446: - ClaimEvidenceRequirement
01447: - SupplierDocument
01448: - ProductEvidenceLink
01449: - DocumentReview
01450: 
01451: RFQ and communication:
01452: 
01453: - RFQ
01454: - RFQLineItem
01455: - RFQLineAttributeValue
01456: - RFQMatch
01457: - RFQResponse
01458: - RFQResponseLine
01459: - Conversation
01460: - Message
01461: - ContactReveal
01462: 
01463: Operations and content:
01464: 
01465: - Report
01466: - Notification
01467: - ContentPage
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
01553: | Moderate products and RFQs | — | — | — | — | — | C | ✓ | ✓ |
01554: | Manage catalogue templates | — | — | — | — | — | C | ✓ | ✓ |
01555: | Manage CMS and SEO | — | — | — | — | — | C | ✓ | ✓ |
01556: | Manage legal texts | — | — | — | — | — | C | ✓ | ✓ |
01557: | Process privacy requests | — | — | — | — | — | C | C | ✓ |
01558: | Manage global security | — | — | — | — | — | — | C | ✓ |
01559: | Permanent export or deletion | — | — | — | — | — | — | C | ✓ |
01560: 
01561: ## 30. Delivery phases
01562: 
01563: ### Phase 0 — Foundation
01564: 
01565: - Architecture decisions
01566: - Repository and CI
01567: - Database migrations
01568: - Design tokens
01569: - Audit foundation
01570: - Documentation and handoff files
01571: 
01572: ### Phase 1 — Identity and supplier activation
01573: 
01574: - Email/password and Google login
01575: - Business identity and company-email verification
01576: - Buyer and Supplier workspaces
01577: - Supplier company profile
01578: - Company-document upload and review
01579: - Fixed roles and permissions
01580: 
01581: ### Phase 2 — Textile catalogue and products
01582: 
01583: - Category tree
01584: - Product templates
01585: - Application-context overlays
01586: - Textile parameters, units and option sets
01587: - Product and variant creation
01588: - Automatic publication
01589: - Product moderation
01590: 
01591: ### Phase 3 — Directory and discovery
01592: 
01593: - Product and supplier directory
01594: - Textile-specific filters
01595: - Search indexing
01596: - Product and supplier pages
01597: - Red editorial implementation
01598: - Turkish and English UI
01599: - Initial SEO
01600: 
01601: ### Phase 4 — RFQ, matching and communication
01602: 
01603: - Single-product RFQ
01604: - Multi-line project RFQ
01605: - RFQ package templates
01606: - Matching and explanation
01607: - Supplier responses by line item
01608: - Context messaging
01609: - Contact reveal
01610: - Notifications
01611: 
01612: ### Phase 5 — Evidence, CMS and governance
01613: 
01614: - Product-claim evidence rules
01615: - Evidence review and expiry
01616: - CMS and editorial collections
01617: - SEO and social metadata
01618: - Legal versioning and acceptance
01619: - Privacy centre and consent
01620: - Reports and operational queues
01621: - Public support page and footer support module
01622: - External donation-provider configuration and support-link analytics
01623: 
01624: ### Phase 6 — Hardening and launch
01625: 
01626: - Accessibility
01627: - Security review
01628: - Performance
01629: - Search tuning
01630: - Backup and recovery
01631: - Seed verification
01632: - End-to-end tests
01633: - Deployment and monitoring
01634: 
01635: ## 31. Launch acceptance criteria
01636: 
01637: The launch is accepted only when:
01638: 
01639: - Only the Home & Contract Textiles vertical is exposed.
01640: - Home, hotel, hospital and dormitory exist as application contexts.
01641: - The seeded textile category tree is available.
01642: - Admin can manage categories, textile parameters, units, options, templates and overlays without code changes.
01643: - The schema resolver produces deterministic product and RFQ forms.
01644: - Buyer business-identity activation works.
01645: - Supplier company-document approval gates commercial supplier activation.
01646: - Product-claim review is separate from supplier activation.
01647: - Active suppliers can publish unlimited complete products automatically.
01648: - Products support variants and at least one public language.
01649: - Search and filters use textile-specific attributes.
01650: - Buyers can create both single-product and multi-line RFQs.
01651: - Suppliers can respond to all or selected RFQ line items.
01652: - Matching respects hard requirements and explains mismatches.
01653: - Messaging remains context-bound.
01654: - Contact reveal obeys field settings.
01655: - Unsupported medical, sterile, PPE and surgical claims are blocked.
01656: - Public evidence labels distinguish supplier declaration from reviewed evidence.
01657: - Admin manages CMS, SEO, legal texts and privacy workflows.
01658: - The platform clearly states that core use is free and donation support is voluntary.
01659: - Donation support never changes access, product visibility, supplier eligibility, matching, moderation or ranking.
01660: - Donation payment details are handled by the configured external provider and are not stored by OpenMarket.
01661: - Public support, support-return and admin support-settings screens are implemented.
01662: - Turkish and English interfaces are usable.
01663: - The red editorial designs are implemented as reusable production components.
01664: - Audit records and handoff documentation remain current.
01665: 
01666: ## 32. Out of scope
01667: 
01668: - Any sector outside home and contract textiles
01669: - Fashion apparel and general clothing
01670: - Footwear and leather goods
01671: - Yarn, fibre and commodity raw-material trading as a standalone marketplace
01672: - Textile machinery and spare parts
01673: - Textile chemicals and dyes
01674: - Furniture, mattresses and non-textile interior products
01675: - Disposable medical supplies
01676: - Medical devices
01677: - PPE
01678: - Sterile and surgical textiles
01679: - Marketplace payment processing
01680: - Escrow
01681: - Logistics or customs brokerage
01682: - Automated quotation calculation
01683: - Contract generation
01684: - Paid promotion
01685: - In-platform donation payment processing
01686: - Donor-only product features, access or limits
01687: - Donor badges, public donor ranking or supplier influence
01688: - Donation-linked search, matching or moderation advantages
01689: - Unverified live donation counters or fabricated funding statistics
01690: - Public ratings and reviews
01691: - Open social messaging
01692: - Automatic certification guarantees
01693: - Native mobile apps
01694: - Custom role builders and moderator delegation
01695: - Arbitrary new sector creation
01696: - More than Turkish and English at initial launch
01697: 
01698: ## 33. Documentation and handoff protocol
01699: 
01700: Repository files:
01701: 
01702: - `spec.md` — product source of truth
01703: - `STATUS.md` — current phase, work, issues, tests and next tasks
01704: - `DECISIONS.md` — dated product and architecture decisions
01705: - `HANDOFF.md` — concise continuation guide
01706: - `ARCHITECTURE.md` — architecture, boundaries, flows and security
01707: - `DATA_MODEL.md` — entities, indexes, dynamic attributes and migrations
01708: - `SEED_CATALOGUE.md` — categories, templates, overlays, parameters, options and documents
01709: - `TEST_PLAN.md` — unit, integration, E2E, permission, privacy and accessibility tests
01710: 
01711: At every session end:
01712: 
01713: 1. Update `STATUS.md`.
01714: 2. Update `HANDOFF.md`.
01715: 3. Record decisions and rejected alternatives.
01716: 4. Record migrations and seed changes.
01717: 5. List tests and results.
01718: 6. Leave no undocumented setup or partial migration.
01719: 
01720: At every new session start:
01721: 
01722: 1. Read `spec.md`.
01723: 2. Read `STATUS.md`.
01724: 3. Read `HANDOFF.md`.
01725: 4. Read recent `DECISIONS.md`.
01726: 5. Inspect repository and git state.
01727: 6. Run documented verification commands.
01728: 7. Continue from the exact next tasks.
01729: 
01730: ## 34. Donation-supported operating model
01731: 
01732: OpenMarket.tr is free to use and is financially supported through voluntary donations or voluntary external support contributions.
01733: 
01734: The donation model is part of the operating model, not a commercial entitlement system.
01735: 
01736: ### 34.1 Funding principles
01737: 
01738: 1. Browsing, supplier registration, product publication, RFQs, RFQ responses, enquiries and context-bound messaging remain free.
01739: 2. A donation never grants product limits, extra visibility, preferred matching, faster review, moderation influence, special contact access or ranking benefits.
01740: 3. Suppliers, buyers and unregistered visitors may support the platform voluntarily.
01741: 4. The platform does not display donor badges, donor leaderboards or donor status on buyer, supplier or product profiles.
01742: 5. Support copy must be factual and non-coercive. It must not imply that a user must donate to keep an account active or to receive service.
01743: 6. Donation CTAs must not interrupt critical commercial flows such as RFQ publication, supplier response submission, document review or account activation.
01744: 7. A support CTA may appear on the homepage, in the footer, on the dedicated support page and as a low-priority dashboard notice.
01745: 8. Search, matching, moderation and support-link systems must remain technically separate.
01746: 
01747: ### 34.2 External donation provider
01748: 
01749: The launch product uses a configurable external donation or support-provider URL.
01750: 
01751: OpenMarket:
01752: 
01753: - Redirects the user to the configured external provider.
01754: - Does not collect card, bank-account or payment-instrument data.
01755: - Does not store donation amounts or payment status unless a later, separately approved provider integration is implemented.
01756: - Opens the provider in a new tab or clearly informs the user that they are leaving OpenMarket.tr.
01757: - Records only privacy-safe support-link events such as placement, language, timestamp and authenticated/anonymous state where consent permits.
01758: - Does not treat a return to `/support/thanks` as proof that a payment was completed.
01759: 
01760: ### 34.3 Public support communication
01761: 
01762: The support experience must communicate all of the following:
01763: 
01764: - **Free to use:** Core platform access and commercial interaction are free.
01765: - **Support the Platform:** Voluntary donations help cover infrastructure, security, moderation, localization and public-interest development.
01766: - **No influence:** Donations do not affect access, visibility, matching, ranking, review outcomes or moderation.
01767: - **External provider:** Donation processing occurs on a third-party provider and is subject to that provider's terms and privacy notice.
01768: 
01769: The public launch does not use an unverified funding-progress counter, fabricated supporter count or fake social proof.
01770: 
01771: ### 34.4 Support content and admin controls
01772: 
01773: Authorized admins can configure:
01774: 
01775: - External support URL
01776: - Turkish and English CTA labels
01777: - Short and long support copy
01778: - Funding principles and use-of-funds copy
01779: - External-provider disclosure
01780: - Homepage support-section visibility
01781: - Footer support-link visibility
01782: - Buyer and supplier dashboard notice visibility
01783: - Support return-page copy
01784: - UTM or internal placement identifiers
01785: - Link event retention period
01786: 
01787: Changes generate audit records.
01788: 
01789: ### 34.5 Support analytics
01790: 
01791: Permitted launch analytics:
01792: 
01793: - Support CTA impressions, only when permitted by the applicable analytics consent
01794: - Support CTA clicks
01795: - CTA placement
01796: - Language
01797: - Anonymous or authenticated context
01798: - Return-page visits
01799: 
01800: Prohibited launch analytics:
01801: 
01802: - Payment-card or bank data
01803: - Donation amount
01804: - Provider account details
01805: - Inferring donor status from a return-page visit
01806: - Using support interaction to change user segmentation, ranking or moderation priority
01807: 
01808: ## 35. Screen definition, counting and delivery scope
01809: 
01810: A **screen** is a separately designed route, wizard step or materially different operational view. Dynamic instances of the same template do not multiply the design count. For example, every category uses the same category-landing screen template.
01811: 
01812: The launch inventory below defines:
01813: 
01814: - Public and SEO-facing screens
01815: - Authentication and onboarding screens
01816: - Buyer workspace screens
01817: - Supplier workspace screens
01818: - Admin and moderator screens
01819: - Shared exception and empty states
01820: 
01821: The inventory contains **113 required designed views**. They should be implemented with approximately **55–65 reusable page compositions**, not as 113 unrelated designs.
01822: 
01823: Priority labels:
01824: 
01825: - **MVP:** Required for the first usable end-to-end product.
01826: - **Launch:** Required before public launch but can follow the first integrated MVP.
01827: 
01828: ## 36. Shared component system
01829: 
01830: All screens must be assembled from shared components. Components must support loading, empty, error, disabled, permission-limited and validation states where applicable.
01831: 
01832: ### 36.1 Foundations and tokens
01833: 
01834: - `ColorTokens`
01835: - `TypographyTokens`
01836: - `SpacingTokens`
01837: - `BorderTokens`
01838: - `ElevationTokens`
01839: - `MotionTokens`
01840: - `Breakpoints`
01841: - `ZIndexScale`
01842: 
01843: Borders use faint, thin neutral or clay-tinted lines. Heavy outlines and decorative drop shadows are avoided except for accessibility-required focus indication.
01844: 
01845: ### 36.2 Brand and navigation
01846: 
01847: - `OpenMarketLogo` — sans-serif wordmark with the full `.tr`
01848: - `WovenLogoMark` — straight interlaced bars; no triangle motif
01849: - `UtilityBar`
01850: - `PublicHeader`
01851: - `PublicFooter`
01852: - `BuyerShell`
01853: - `SupplierShell`
01854: - `AdminShell`
01855: - `SidebarNavigation`
01856: - `MobileNavigationDrawer`
01857: - `Breadcrumbs`
01858: - `PageHeader`
01859: - `SectionHeader`
01860: 
01861: ### 36.3 UI primitives
01862: 
01863: - `Button`
01864: - `IconButton`
01865: - `TextLink`
01866: - `Badge`
01867: - `StatusBadge`
01868: - `Chip`
01869: - `Avatar`
01870: - `Divider`
01871: - `Card`
01872: - `Popover`
01873: - `Tooltip`
01874: - `DropdownMenu`
01875: - `Tabs`
01876: - `Accordion`
01877: - `Modal`
01878: - `Drawer`
01879: - `Pagination`
01880: - `Table`
01881: - `Timeline`
01882: 
01883: ### 36.4 Form components
01884: 
01885: - `TextField`
01886: - `TextArea`
01887: - `SelectField`
01888: - `MultiSelect`
01889: - `Combobox`
01890: - `Checkbox`
01891: - `RadioGroup`
01892: - `Toggle`
01893: - `DateField`
01894: - `QuantityUnitField`
01895: - `DimensionSetField`
01896: - `ColorField`
01897: - `FileUploader`
01898: - `ImageUploader`
01899: - `RichTextEditor`

## Source lines 2036-2241

02036: | A02 | Register | /auth/register | AuthLayout, RegistrationForm, IntendedUseSelector, OAuthButton, ConsentCheckboxes, PasswordStrength | MVP |
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
02180: 
02181: - Meet WCAG 2.2 AA for contrast, keyboard access, focus visibility and semantic structure.
02182: - Every input has a persistent label; placeholders never replace labels.
02183: - Dynamic parameter fields expose errors through `aria-describedby` and an error summary.
02184: - Dialogs trap focus and restore it when closed.
02185: - Tables include semantic headers and captions where useful.
02186: - Status is not conveyed through colour alone.
02187: - Reduced-motion preference is respected.
02188: 
02189: ## 39. Front-end composition and route architecture
02190: 
02191: Recommended front-end structure:
02192: 
02193: ```text
02194: /public
02195:   index.html
02196:   contexts/
02197:   categories/
02198:   products/
02199:   suppliers/
02200:   collections/
02201:   buying-requests/
02202:   support/
02203:   legal/
02204: /app
02205:   buyer/
02206:   supplier/
02207:   admin/
02208: /assets
02209:   css/
02210:     tokens.css
02211:     reset.css
02212:     typography.css
02213:     layout.css
02214:     components.css
02215:     utilities.css
02216:   js/
02217:     components/
02218:     pages/
02219:     router/
02220:     state/
02221:     fixtures/
02222:   images/
02223: ```
02224: 
02225: Public SEO pages should have crawlable page-level HTML output. Buyer, supplier and admin areas may use a shared application shell with route-driven content.
02226: 
02227: No screen may copy and independently restyle a shared component when a component variant can represent the difference.
02228: 
02229: ## 40. Additional acceptance criteria for screens and support
02230: 
02231: The implementation is not accepted unless:
02232: 
02233: - Every screen in Section 37 has a route or documented application view.
02234: - Every screen is composed from the shared component catalogue.
02235: - Public support messaging appears on the homepage, support page and footer.
02236: - The admin support-settings screen controls support URL and public copy without code changes.
02237: - Support links clearly identify an external provider.
02238: - No donor badge, donor ranking, donor-only feature or donation-linked visibility exists.
02239: - Search bars have no decorative drop shadow and use faint thin borders.
02240: - Card and section dividers use the shared subtle border tokens.
02241: - Header and footer use a sans-serif `OpenMarket.tr` wordmark and a woven mark without triangles.
