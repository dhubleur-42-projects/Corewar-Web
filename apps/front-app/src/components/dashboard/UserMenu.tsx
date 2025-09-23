import { Button, Menu, MenuItem, styled } from '@mui/material'
import useStore from '../../common/store/store'
import { defineI18n, useTranslate } from '../../common/utils/i18n'
import { useCallback, useState } from 'react'
import { useLogout } from '../../common/queries/useAuthQueries'
import { useNavigate } from 'react-router'
import Language from '../../common/utils/language'
import CheckIcon from '@mui/icons-material/Check'

const i18n = defineI18n({
	en: {
		profilePictureAlt: 'Profile Picture',
		menu: {
			profile: 'Profile',
			language: 'Language',
			logout: 'Logout',
		},
		locale: {
			[Language.en]: 'English',
			[Language.fr]: 'French',
		},
	},
	fr: {
		profilePictureAlt: 'Photo de profil',
		menu: {
			profile: 'Profil',
			language: 'Langue',
			logout: 'Déconnexion',
		},
		locale: {
			[Language.en]: 'Anglais',
			[Language.fr]: 'Français',
		},
	},
})

const ImageButton = styled(Button)({
	width: 32,
	height: 32,
	padding: 0,
	minWidth: 0,
	borderRadius: '50%',
	overflow: 'hidden',
})

const ProfilePicture = styled('img')({
	width: 32,
	height: 32,
	borderRadius: '50%',
})

const CheckMark = styled(CheckIcon)<{ checked?: boolean }>(({ checked }) => ({
	visibility: checked ? 'visible' : 'hidden',
}))

const MenuElement = styled(MenuItem)({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'left',
	gap: 4,
	padding: '4px 16px',
})

function UserMenu() {
	const translate = useTranslate()
	const navigate = useNavigate()
	const { user, setUser, setLocale, locale } = useStore()

	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
	const isMenuOpen = menuAnchorEl != null

	const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
		setMenuAnchorEl(event.currentTarget)
	}
	const handleCloseMenu = () => {
		setMenuAnchorEl(null)
		setLanguageMenuAnchorEl(null)
	}

	const { mutate: logoutMutate } = useLogout()

	const handleLogout = useCallback(() => {
		logoutMutate(undefined, {
			onSuccess: () => {
				resetFetchMe()
				setUser(null)
				navigate('/', { replace: true })
			},
		})
	}, [logoutMutate, setUser, navigate, resetFetchMe])

	const [languageMenuAnchorEl, setLanguageMenuAnchorEl] =
		useState<null | HTMLElement>(null)
	const isLanguageMenuOpen = languageMenuAnchorEl != null

	const openLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
		setLanguageMenuAnchorEl(event.currentTarget)
	}

	const handleCloseLanguageMenu = () => {
		setLanguageMenuAnchorEl(null)
	}

	const changeLanguage = (newLocale: Language) => {
		handleCloseLanguageMenu()
		handleCloseMenu()
		// Delay the locale change to be sure the menu is closed before
		setTimeout(() => {
			setLocale(newLocale)
		}, 100)
	}

	const goToProfile = () => {
		handleCloseMenu()
		navigate('/dashboard/profile')
	}

	return (
		<>
			<ImageButton onClick={handleOpenMenu}>
				<ProfilePicture
					src={user!.profilePictureUrl}
					alt={translate(i18n.profilePictureAlt)}
				/>
			</ImageButton>
			<Menu
				anchorEl={menuAnchorEl}
				open={isMenuOpen}
				onClose={handleCloseMenu}
			>
				<MenuElement onClick={goToProfile}>
					{translate(i18n.menu.profile)}
				</MenuElement>
				<MenuElement onClick={openLanguageMenu}>
					{translate(i18n.menu.language)}
				</MenuElement>
				<MenuElement onClick={handleLogout}>
					{translate(i18n.menu.logout)}
				</MenuElement>
			</Menu>
			<Menu
				anchorEl={languageMenuAnchorEl}
				open={isLanguageMenuOpen}
				onClose={handleCloseLanguageMenu}
				anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				{Object.values(Language).map((lang) => (
					<MenuElement
						key={`language-option-${lang}`}
						onClick={() => changeLanguage(lang)}
					>
						<CheckMark checked={locale === lang} />
						{translate(i18n.locale[lang])}
					</MenuElement>
				))}
			</Menu>
		</>
	)
}

export default UserMenu
function resetFetchMe() {
	throw new Error('Function not implemented.')
}
